import { AddActionsForResourceParams, PolicyStatement, NormalizedDefinition } from './interfaces/interfaces'
import * as fs from 'fs'
import { pascalPrivName } from './utils'




export class PolicyStatementGenerator {
    private readonly iamDefinition: NormalizedDefinition
    private readonly allowedConditions: string[] = []
    private readonly statement: PolicyStatement

    constructor () {
        this.statement = {
            effect: 'Allow',
            action: [],
            resource: []
        }

        this.iamDefinition = JSON.parse( fs.readFileSync( `./lib/normalizedDefinition.json`, 'utf-8' ) )
    }



    //@ts-ignore
    addActionsForService( services: string ): PolicyStatementGenerator {


        return this
    }


    /**
     * 
     * @param service 
     * @param resource 
     * @param privilegeLevels 
     * @returns 
     */
    addActionsForResource( params: AddActionsForResourceParams ): PolicyStatementGenerator {

        const resourceDefinition = this.iamDefinition.resources[ params.service ][ params.resource ]

        for ( let privilegeLevel of params.privilegeLevels ) {
            for ( let action in resourceDefinition[ privilegeLevel ] ) {

                let privilege = resourceDefinition[ privilegeLevel ][ action ]
                this.statement.action.push( `${params.service}:${privilege.privilege}` )
            }
        }

        return this
    }

    /**
     * 
     * @param actions 
     * @returns 
     */
    addSpecificActions( actions: string[] ): PolicyStatementGenerator {
        this.statement.action.push( ...actions )

        return this
    }



    /**
     * 
     * @returns 
     */
    addDependentActions(): PolicyStatementGenerator {
        const policyActions: string[] = this.statement.action


        for ( let action of policyActions ) {

            // Since an action is in the form of service:Privilege, we need to split it to check the privileges
            // Assuming an action is in the right format like s3:CreateBucket, the 0th index will be the service
            // and the 1st index will be the privilege
            let splitAction = action.split( ':' )
            let privilege = this.iamDefinition.privileges[ splitAction[ 0 ] ][ pascalPrivName( splitAction[ 1 ] ) ]

            if ( privilege.dependentActions.length > 0 ) {
                this.statement.action.push( ...privilege.dependentActions )
            }
        }

        return this
    }

    getAllowedConditions(): void {

        const policyActions: string[] = this.statement.action

        for ( let action of policyActions ) {
            let splitAction = action.split( ':' )
            let privilege = this.iamDefinition.privileges[ splitAction[ 0 ] ][ pascalPrivName( splitAction[ 1 ] ) ]

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
        if ( !this.statement.condition ) {
            return
        }

        for ( let condition of this.statement.condition ) {
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

        if ( this.statement.resource.length == 0 ) {
            this.statement.resource.push( '*' )
        }

        this.statement.action = this.statement.action.sort()
        //console.log(this.allowedConditions)
        return this.statement
    }



}