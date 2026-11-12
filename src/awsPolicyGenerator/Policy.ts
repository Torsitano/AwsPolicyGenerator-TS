import type { PolicyDocument as CdkPolicyDocument } from 'aws-cdk-lib/aws-iam'
import { stringify } from 'yaml'
import { Effect, Grant, PolicyDocument, ServiceGrant } from './interfaces/interfaces'
import { actionsForService } from './catalog'
import { Statement } from './statementComponents/Statement'

export class Policy {
    private readonly statements: Statement[] = []

    grant(grant: Grant | ServiceGrant, effect: `${Effect}` = 'Allow'): this {
        if ('resource' in grant) {
            if (typeof grant.resource !== 'string') throw new Error('Supply a resource type for a resource grant')
            return this.addStatement(Statement.forResource({ ...grant, resource: grant.resource }, effect))
        }
        if ('arn' in grant) throw new Error('Supply the resource type when granting access to an ARN')
        const actions = actionsForService(grant.service, grant.access)
        if (!actions.length) throw new Error(`No matching actions for ${grant.service} at ${grant.access.join(', ')}`)
        return this.addStatement(new Statement(effect).addActions(actions).onResources('*'))
    }

    addStatement(statement: Statement): this {
        this.statements.push(statement)
        return this
    }

    addStatementsToPolicy(statements: readonly Statement[]): this {
        this.statements.push(...statements)
        return this
    }

    build(): PolicyDocument {
        if (!this.statements.length) throw new Error('Add at least one statement to the policy')
        return { Version: '2012-10-17', Statement: this.statements.map(s => s.build()) }
    }

    toCdk(): CdkPolicyDocument {
        const { PolicyDocument } = require('aws-cdk-lib/aws-iam') as typeof import('aws-cdk-lib/aws-iam')
        return PolicyDocument.fromJson(this.build())
    }

    toJson(): string { return JSON.stringify(this.build(), null, 2) }
    toYaml(): string { return stringify(this.build()) }
}
