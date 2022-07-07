import { PolicyStatement } from './interfaces/interfaces'
import { PolicyBase } from './PolicyBase'
import { stringify, parse } from 'yaml'



export class Statement extends PolicyBase {
    statement: PolicyStatement

    constructor () {
        super()
        this.statement = {
            effect: 'Allow',
            action: [],
            resource: []
        }
    }

    toYaml(): string {
        return stringify( this.statement )
    }

    fromYaml( input: string ): void {
        this.statement = parse( input )
    }

    toJson(): string {
        return JSON.stringify( this.statement, null, 4 )
    }

    fromJson( input: string ): void {
        this.statement = JSON.parse( input )
    }
}