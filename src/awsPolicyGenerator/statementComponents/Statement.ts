import { parse, stringify } from 'yaml'
import type { PolicyStatement as CdkPolicyStatement } from 'aws-cdk-lib/aws-iam'
import { ActionDetails, catalogArn, describeAction, inspectResource, resourceTemplate, sorted } from '../catalog'
import {
    Access, AddActionsForResourceParams, Effect, Grant, PolicyStatement, PrivilegeLevel,
    ResourceSelection, StatementCondition,
} from '../interfaces/interfaces'
import { checkScope, typeWideScope, validateArn } from '../scope'

export { Effect }
const levels: Record<PrivilegeLevel, Access> = {
    readPrivileges: 'Read', writePrivileges: 'Write', listPrivileges: 'List',
    tagPrivileges: 'Tagging', permManPrivileges: 'Permissions management',
}

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function strings(value: unknown, label: string): string[] {
    const values = typeof value === 'string' ? [value] : value
    if (!Array.isArray(values) || !values.length || !values.every(v => typeof v === 'string' && v.length)) {
        throw new Error(`${label} must be a string or a nonempty string array`)
    }
    return sorted(values)
}

function conditionBlock(value: unknown): StatementCondition {
    if (!record(value) || !Object.keys(value).length) throw new Error('Condition must contain an operator')
    for (const [operator, keys] of Object.entries(value)) {
        if (!operator || !record(keys) || !Object.keys(keys).length) {
            throw new Error('Condition operators require a key and value')
        }
        for (const [name, operand] of Object.entries(keys)) {
            const values = Array.isArray(operand) ? operand : [operand]
            if (!name || !values.length || !values.every(v => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)))) {
                throw new Error(`Invalid condition value for ${operator} ${name}`)
            }
        }
    }
    return structuredClone(value) as StatementCondition
}

export class Statement {
    public readonly effect: `${Effect}`
    private readonly actions = new Map<string, ActionDetails>()
    private scope: string[] = []
    private selected?: { service: string, resource: string }
    private conditions?: StatementCondition
    private sid?: string

    constructor(effect: `${Effect}` = 'Allow', includeRequiredResources = false) {
        if (effect !== 'Allow' && effect !== 'Deny') throw new Error(`Invalid effect: ${effect}`)
        if (includeRequiredResources) throw new Error('Scope additional required resource types explicitly in separate statements')
        this.effect = effect
    }

    static forResource(grant: Grant, effect: `${Effect}` = 'Allow'): Statement {
        return new Statement(effect).selectResource(grant, grant.arn)
    }

    static fromJson(input: string): Statement { return Statement.buildFrom(JSON.parse(input)) }
    static fromYaml(input: string): Statement { return Statement.buildFrom(parse(input)) }

    /** Read the supported identity-statement subset. Reject fields that would be lost on export. */
    static buildFrom(value: unknown): Statement {
        if (!record(value)) throw new Error('Expected an IAM statement object')
        const fields = new Map<string, unknown>()
        for (const [key, item] of Object.entries(value)) {
            const name = key.toLowerCase()
            if (!['sid', 'effect', 'action', 'resource', 'condition'].includes(name) || fields.has(name)) {
                throw new Error(`Unsupported or duplicate statement field: ${key}`)
            }
            fields.set(name, item)
        }
        const effect = fields.get('effect')
        if (effect !== 'Allow' && effect !== 'Deny') throw new Error('Effect must be Allow or Deny')
        const statement = new Statement(effect)
            .addActions(strings(fields.get('action'), 'Action'))
            .onResources(strings(fields.get('resource'), 'Resource'))
        if (fields.has('condition')) statement.conditions = conditionBlock(fields.get('condition'))
        if (fields.has('sid')) {
            const sid = fields.get('sid')
            if (typeof sid !== 'string') throw new Error('Sid must be a string')
            statement.sid = sid
        }
        return statement
    }

    selectResource(selection: ResourceSelection, arn?: string): this {
        const { actions } = inspectResource(selection)
        if (!actions.length) throw new Error(`No matching actions for ${selection.service}:${selection.resource} at ${selection.access.join(', ')}`)
        if (this.selected && (this.selected.service !== selection.service || this.selected.resource !== selection.resource)) {
            throw new Error('Use a separate policy statement for each resource type')
        }
        if (arn !== undefined && this.scope.length && (this.scope.length !== 1 || this.scope[0] !== arn)) {
            throw new Error('Use Policy.grant for a separate resource scope')
        }
        const scope = arn === undefined ? this.scope : [arn]
        for (const target of scope) checkScope(target, resourceTemplate(selection.service, selection.resource))
        // Resolve all existing actions before mutating, including their resource-specific metadata.
        const existing = this.getActions().map(action => {
            if (!action.startsWith(selection.service + ':')) throw new Error(`${action} belongs to a different service`)
            return describeAction(action, selection.resource)
        })
        this.selected = { service: selection.service, resource: selection.resource }
        this.scope = scope
        for (const action of [...existing, ...actions]) this.actions.set(action.action, action)
        return this
    }

    addActionsForResource(props: AddActionsForResourceParams): this {
        return this.selectResource({
            service: props.service, resource: props.resource, access: props.privLevels.map(level => levels[level]),
        }, props.resourceArn)
    }

    addActions(names: readonly string[]): this {
        const additions = names.map(name => {
            if (this.selected && !name.startsWith(this.selected.service + ':')) {
                throw new Error(`Use a separate statement for ${name}`)
            }
            return describeAction(name, this.selected?.resource)
        })
        for (const action of additions) this.actions.set(action.action, action)
        return this
    }

    addSpecificActions(names: readonly string[]): this { return this.addActions(names) }

    /** Explicitly set the shared Resource field for every action in this statement. */
    onResources(arns: string | readonly string[]): this {
        const next = strings(arns, 'Resource')
        for (const target of next) {
            if (this.selected) checkScope(target, resourceTemplate(this.selected.service, this.selected.resource))
            else if (target !== '*') validateArn(target)
        }
        this.scope = next
        return this
    }

    withConditions(conditions: StatementCondition): this {
        this.conditions = conditionBlock(conditions)
        return this
    }

    get accessLevels(): Set<Access> { return new Set([...this.actions.values()].map(a => a.accessLevel)) }
    get allowedConditions(): Set<string> { return new Set([...this.actions.values()].flatMap(a => a.conditionKeys)) }
    getActions(): string[] { return sorted(this.actions.keys()) }
    getResourceArns(): string[] {
        if (this.scope.length || !this.selected) return [...this.scope]
        const { service, resource } = this.selected
        const alternatives = sorted([...this.actions.values()].flatMap(a => a.supportedResourceTypes))
            .filter(name => name !== resource)
            .map(name => catalogArn(service, name))
        return [typeWideScope(resourceTemplate(service, resource), alternatives)]
    }
    getConditions(): StatementCondition { return structuredClone(this.conditions ?? {}) }
    getDependentActions(): string[] { return sorted([...this.actions.values()].flatMap(a => a.dependentActions)) }

    build(): PolicyStatement {
        if (!this.actions.size) throw new Error('Select actions before building a statement')
        const scope = this.getResourceArns()
        if (!scope.length) throw new Error('Supply a resource ARN or call onResources before building a statement')
        if (!scope.includes('*')) {
            for (const action of this.actions.values()) {
                if (!action.supportedResourceTypes.length) throw new Error(`${action.action} requires Resource "*"; use a separate statement`)
            }
        }
        return {
            ...(this.sid === undefined ? {} : { Sid: this.sid }),
            Effect: this.effect, Action: this.getActions(), Resource: scope,
            ...(this.conditions === undefined ? {} : { Condition: this.getConditions() }),
        }
    }

    toJson(): string { return JSON.stringify(this.build(), null, 2) }
    toYaml(): string { return stringify(this.build()) }
    toCdk(): CdkPolicyStatement {
        const { PolicyStatement } = require('aws-cdk-lib/aws-iam') as typeof import('aws-cdk-lib/aws-iam')
        return PolicyStatement.fromJson(this.build())
    }
}
