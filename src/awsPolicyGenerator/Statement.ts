import { PolicyStatement } from './interfaces/interfaces'
import { PolicyBase } from './PolicyBase'
import { stringify } from 'yaml'



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

    toJson(): string {
        return JSON.stringify( this.statement, null, 4 )
    }
}