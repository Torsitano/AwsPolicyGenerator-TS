import { Access, AccessLevel, ResourceSelection } from './interfaces/interfaces'

interface Metadata {
    conditions?: string[]
    dependencies?: string[]
}

interface Link extends Metadata {
    required?: true
}

interface Action extends Metadata {
    level: Access
    resources: Record<string, Link>
}

interface Resource {
    arn: string | null
    conditions?: string[]
}

interface Service {
    reference: string
    resources: Record<string, Resource>
    actions: Record<string, Action>
}

// The package ships this file alongside dist. Resolution is independent of the caller's cwd.
const services: Record<string, Service> = require('../../data/catalog.json')

export interface ActionDetails {
    action: string
    accessLevel: Access
    conditionKeys: string[]
    dependentActions: string[]
    requiredResourceTypes: string[]
    supportedResourceTypes: string[]
}

export function sorted(values: Iterable<string>): string[] {
    return [...new Set(values)].sort()
}

function lookup<T>(entries: Record<string, T>, key: string, label: string): T {
    if (typeof key !== 'string' || !Object.hasOwn(entries, key)) {
        throw new Error(`Unknown ${label}: ${key}`)
    }
    return entries[key]!
}

function serviceFor(prefix: string): Service {
    return lookup(services, prefix, 'service')
}

export function listServices(): string[] {
    return Object.keys(services).sort()
}

export function listResources(service: string): string[] {
    return Object.keys(serviceFor(service).resources).sort()
}

export function catalogArn(service: string, name: string): string | null {
    return lookup(serviceFor(service).resources, name, `resource type for ${service}`).arn
}

export function resourceTemplate(service: string, name: string): string {
    const arn = catalogArn(service, name)
    if (arn === null) throw new Error(`The catalog has no ARN format for ${service}:${name}`)
    return arn
}

function details(prefix: string, name: string, action: Action, service: Service, selected?: string): ActionDetails {
    const supported = Object.keys(action.resources)
    const conditionKeys = [...(action.conditions ?? [])]
    const dependencies = [...(action.dependencies ?? [])]
    for (const type of selected === undefined ? supported : [selected]) {
        const link = action.resources[type]!
        conditionKeys.push(...(service.resources[type]?.conditions ?? []), ...(link.conditions ?? []))
        dependencies.push(...(link.dependencies ?? []))
    }
    return {
        action: `${prefix}:${name}`,
        accessLevel: action.level,
        conditionKeys: sorted(conditionKeys),
        dependentActions: sorted(dependencies),
        requiredResourceTypes: supported.filter(type => action.resources[type]!.required).sort(),
        supportedResourceTypes: supported.sort(),
    }
}

export function describeAction(qualified: string, resource?: string): ActionDetails {
    const [prefix, name, ...extra] = qualified.split(':')
    if (!prefix || !name || extra.length) throw new Error(`Expected service:Action, got ${qualified}`)
    const service = serviceFor(prefix)
    const action = lookup(service.actions, name, `action for ${prefix}`)
    if (resource !== undefined && !Object.hasOwn(action.resources, resource)) {
        throw new Error(`${qualified} does not support resource type ${prefix}:${resource}`)
    }
    return details(prefix, name, action, service, resource)
}

function validateAccess(access: readonly Access[]): void {
    if (!Array.isArray(access) || !access.length) throw new Error('Select at least one access level')
    for (const level of access) {
        if (!Object.values<string>(AccessLevel).includes(level)) throw new Error(`Unknown access level: ${level}`)
    }
}

export function actionsForService(prefix: string, access: readonly Access[]): string[] {
    validateAccess(access)
    return Object.entries(serviceFor(prefix).actions)
        .filter(([, action]) => access.includes(action.level))
        .map(([name]) => `${prefix}:${name}`)
}

export function inspectResource({ service: prefix, resource, access }: ResourceSelection) {
    const service = serviceFor(prefix)
    const arnTemplate = lookup(service.resources, resource, `resource type for ${prefix}`).arn
    validateAccess(access)
    const actions = Object.entries(service.actions)
        .filter(([, action]) => access.includes(action.level) && Object.hasOwn(action.resources, resource))
        .map(([name, action]) => details(prefix, name, action, service, resource))
    return { service: prefix, resource, arnTemplate, reference: service.reference, actions }
}

export function actionsForResource(selection: ResourceSelection): string[] {
    return inspectResource(selection).actions.map(item => item.action)
}
