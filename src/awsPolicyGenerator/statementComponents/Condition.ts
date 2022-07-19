import { ConditionType, ConditionTypeProperties } from '../interfaces/interfaces'



export class Condition {
    public readonly condition: string
    public readonly service: string
    public readonly conditionType: ConditionType
    public readonly includesVariable: boolean


    constructor ( condition: ConditionTypeProperties, modifier: string ) {
        this.condition = condition.condition
        this.conditionType = condition.type
        this.service = condition.condition.split( ':' )[ 0 ]
        this.includesVariable = condition.condition.includes( '$' )
    }

    public static buildConditionStatement( conditions: Condition[] ) {

    }
}
