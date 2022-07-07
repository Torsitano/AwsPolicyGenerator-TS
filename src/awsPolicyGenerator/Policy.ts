import { PolicyStatement } from './interfaces/interfaces'
import { PolicyBase } from './PolicyBase'
import { Statement } from './Statement'




export class Policy extends PolicyBase {
    private policyStatements: PolicyStatement[] = []


    constructor () {
        super()
    }


    toYaml(): string {
        return ''
    }

    fromYaml( input: string ): void {

    }

    toJson(): string {
        return ''
    }

    fromJson( input: string ): void {

    }

    private addStatementToPolicy( statement: Statement ) {

    }

    addStatementsToPolicy( statements: Statement[] ) {
        for ( let statement of statements ) {
            this.addStatementToPolicy( statement )
        }
    }
}