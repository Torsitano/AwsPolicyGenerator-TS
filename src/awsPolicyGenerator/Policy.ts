import { stringify } from 'yaml'
import { Effect, Grant, PolicyDocument } from './interfaces/interfaces'
import { Statement } from './statementComponents/Statement'

export class Policy {
    private readonly statements: Statement[] = []

    grant(grant: Grant, effect: `${Effect}` = 'Allow'): this {
        return this.addStatement(Statement.forResource(grant, effect))
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

    toJson(): string { return JSON.stringify(this.build(), null, 2) }
    toYaml(): string { return stringify(this.build()) }
}
