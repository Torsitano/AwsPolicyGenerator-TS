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
        this.getAllowedConditions( privilegeDefintion )
        this.getResources( privilegeDefintion )

    }

    /**
     * 
     * @param actions 
     * @returns 
     */
    public static getRequiredResources( actions: Action[] ): ResourceOnAction[] {
        const requiredResources: ResourceOnAction[] = []

        for ( let action of actions ) {
            for ( let resource of action.resources ) {
                if ( resource.required ) {
                    const check = requiredResources.some(
                        item => item.resourceArn === resource.resourceArn
                    )

                    if ( !check ) {
                        requiredResources.push( resource )
                    }
                }
            }
        }

        return requiredResources.sort()
    }


    /**
     * 
     * @param privilegeDefintion 
     */
    public getAllowedConditions( privilegeDefintion: NormalizedPrivilege ): void {
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

    public getResources( privilegeDefintion: NormalizedPrivilege ): void {
        for ( let resource in privilegeDefintion.resources ) {
            this.resources.push( privilegeDefintion.resources[ resource ] )
        }
    }


}