import { AccessLevel, NormalizedPrivilege, ConditionType } from '../interfaces/interfaces'

//@ts-ignore
interface Resource {
    resourceName: string,
    resourceArn: string,
    required: boolean,
    resourceConditions: string[]
}

//@ts-ignore
interface Condition {
    condition: string,
    description: string,
    type: ConditionType
}

export interface NewAction {

}

export class Action {
    public readonly privilege: string
    public readonly service: string
    public readonly action: string
    public readonly accessLevel: AccessLevel
    public readonly resources: string[] = []
    public readonly dependentActions: string[]
    public allowedConditions: string[] = []

    constructor ( privilegeDefintion: NormalizedPrivilege ) {
        this.privilege = privilegeDefintion.privilege
        this.service = privilegeDefintion.service
        this.action = `${this.service}:${this.privilege}`
        this.accessLevel = privilegeDefintion.accessLevel
        this.fetchAllowedConditions( privilegeDefintion )
        this.resources = Object.keys( privilegeDefintion.resources ).sort()
        this.dependentActions = Object.values( privilegeDefintion.dependentActions ).sort()
    }


    /**
     * 
     * @param privilegeDefintion 
     */
    fetchAllowedConditions( privilegeDefintion: NormalizedPrivilege ): void {
        for ( let condition in privilegeDefintion.privConditions ) {
            this.allowedConditions.push( condition )
            //this.allowedConditions.push( privilegeDefintion.privConditions[ condition ] )
        }

        for ( let resource in privilegeDefintion.resources ) {
            for ( let condition in privilegeDefintion.resources[ resource ].resourceConditions ) {
                if ( !this.allowedConditions.includes( condition ) ) {
                    this.allowedConditions.push( condition )
                }
            }
        }
        this.allowedConditions = this.allowedConditions.sort()
    }


}