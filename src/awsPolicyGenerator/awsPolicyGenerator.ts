import { AddActionsForResourceParams } from './interfaces/interfaces'
import { NormalizedDefinition, PolicyStatement } from "./interfaces"
import * as fs from 'fs'

export enum Service {
    IAM = 'iam',
    EC2 = 'ec2'
}






export class AwsPolicyGenerator {
    private readonly policyStatement: PolicyStatement
    private readonly iamDefinition: NormalizedDefinition
    private readonly allowedConditions: string[]

    constructor () {
        this.policyStatement = {
            version: '2012-10-17',
            effect: 'Allow',
            action: [],
            resource: []
        }

        this.iamDefinition = JSON.parse( fs.readFileSync( `./lib/normalizedDefinition.json`, 'utf-8' ) )

        this.allowedConditions = []
    }

    // public AwsPolicyChecker = new class {
    //     private superThis: AwsPolicyGenerator

    //     constructor(superThis: AwsPolicyGenerator) {
    //         this.superThis = superThis
    //     }

    // }(this)

    //@ts-ignore
    addActionsForService( services: string ): AwsPolicyGenerator {


        return this
    }


    /**
     * 
     * @param service 
     * @param resource 
     * @param privilegeLevels 
     * @returns 
     */
    addActionsForResource( params: AddActionsForResourceParams ): AwsPolicyGenerator {

        const resourceDefinition = this.iamDefinition.resources[ params.service ][ params.resource ]

        for ( let privilegeLevel of params.privilegeLevels ) {
            for ( let action in resourceDefinition[ privilegeLevel ] ) {

                let privilege = resourceDefinition[ privilegeLevel ][ action ]
                this.policyStatement.action.push( `${params.service}:${privilege.privilege}` )
            }
        }

        return this
    }

    /**
     * 
     * @param actions 
     * @returns 
     */
    addSpecificActions( actions: string[] ): AwsPolicyGenerator {
        this.policyStatement.action.push( ...actions )

        return this
    }


    pascalPrivName( privilege: string ): string {
        const pascalName = privilege.charAt( 0 ).toLowerCase() + privilege.substring( 1 )
        return pascalName
    }

    /**
     * 
     * @returns 
     */
    addDependentActions(): AwsPolicyGenerator {
        const policyActions: string[] = this.policyStatement.action


        for ( let action of policyActions ) {

            // Since an action is in the form of service:Privilege, we need to split it to check the privileges
            // Assuming an action is in the right format like s3:CreateBucket, the 0th index will be the service
            // and the 1st index will be the privilege
            let splitAction = action.split( ':' )
            let privilege = this.iamDefinition.privileges[ splitAction[ 0 ] ][ this.pascalPrivName( splitAction[ 1 ] ) ]

            if ( privilege.dependentActions.length > 0 ) {
                this.policyStatement.action.push( ...privilege.dependentActions )
            }
        }

        return this
    }

    getAllowedConditions(): void {

        const policyActions: string[] = this.policyStatement.action

        for ( let action of policyActions ) {
            let splitAction = action.split( ':' )
            let privilege = this.iamDefinition.privileges[ splitAction[ 0 ] ][ this.pascalPrivName( splitAction[ 1 ] ) ]

            for ( let condition in privilege.privConditions ) {
                if ( !this.allowedConditions.includes( condition ) ) {
                    this.allowedConditions.push( condition )
                }
            }

            for ( let resourceKey in privilege.resources ) {
                let resource = privilege.resources[ resourceKey ]
                for ( let conditionKey in resource.resourceConditions ) {
                    let condition = resource.resourceConditions[ conditionKey ]
                    if ( !this.allowedConditions.includes( condition.condition ) ) {
                        this.allowedConditions.push( condition.condition )
                    }

                }
            }
        }

    }


    /**
     * 
     * @returns 
     */
    checkConditions(): void {
        if ( !this.policyStatement.condition ) {
            return
        }

        for ( let condition of this.policyStatement.condition ) {
            if ( !this.allowedConditions.includes( condition ) ) {
                throw new Error( 'Condition added that is not allowed' )
            }
        }

        return
    }


    /**
     * Check if depedent actions are higher privilege
     */
    checkDependentActionPrivLevel(): void {

    }

    /**
     * 
     */
    build(): PolicyStatement {

        this.getAllowedConditions()
        this.checkConditions()
        this.addDependentActions()

        if ( this.policyStatement.resource.length == 0 ) {
            this.policyStatement.resource.push( '*' )
        }

        this.policyStatement.action = this.policyStatement.action.sort()
        //console.log(this.allowedConditions)
        return this.policyStatement
    }



}