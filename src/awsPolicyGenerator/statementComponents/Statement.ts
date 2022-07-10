import { Action } from './Action'
import { Condition } from './Condition'
import { Resource } from './Resource'


export type Effect = 'Allow' | 'Deny'


class Statement {
    public effect: Effect
    public conditions?: Condition[]
    public actions?: Action[]
    public resources?: Resource[]


    constructor ( effect: Effect ) {
        this.effect = effect
    }
}