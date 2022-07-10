import { AccessLevel, NormalizedPrivilege, ImportConditions } from '../interfaces/interfaces'

export interface ResourceOnAction {
    resourceName: string,
    resourceArn: string,
    required: boolean,
    resourceConditions: ImportConditions
}


// interface Condition {
//     condition: string,
//     description: string,
//     type: ConditionType
// }

export interface NewAction {

}

export class Action {
    public readonly privilege: string
    public readonly service: string
    public readonly action: string
    public readonly accessLevel: AccessLevel
    public readonly resources: ResourceOnAction[] = []
    public readonly dependentActions: string[]
    public allowedConditions: string[] = []

    constructor ( privilegeDefintion: NormalizedPrivilege ) {
        this.privilege = privilegeDefintion.privilege
        this.service = privilegeDefintion.service
        this.action = `${this.service}:${this.privilege}`
        this.accessLevel = privilegeDefintion.accessLevel
        this.dependentActions = Object.values( privilegeDefintion.dependentActions ).sort()
        this.fetchAllowedConditions( privilegeDefintion )
        this.fetchResources( privilegeDefintion )

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

    fetchResources( privilegeDefintion: NormalizedPrivilege ): void {
        for ( let resource in privilegeDefintion.resources ) {
            this.resources.push( privilegeDefintion.resources[ resource ] )
        }
    }


}