import { AddActionsForResourceParams, PolicyStatement, NormalizedDefinition, AddActionsForServiceParams } from './interfaces/interfaces'
import * as fs from 'fs'
import { camelPrivName } from './utils'




export class StatementGenerator {
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


    /**
     * 
     * @param props 
     * @returns 
     */
    addActionsForService( props: AddActionsForServiceParams ): StatementGenerator {
        this.statement.action.push( ...this.getActionsForService( props ) )
        return this
    }

    /**
     * FIXME: This will miss actions not for a specific resource, need to refactor
     * 
     * @returns 
     */
    getActionsForService( { service, privilegeLevels }: AddActionsForServiceParams ): string[] {
        const actions: string[] = []

        const serviceDefinition = this.iamDefinition.resources[ service ]

        for ( let resource in serviceDefinition ) {
            actions.push( ...this.getActionsForResource( { service, resource, privilegeLevels } ) )
        }

        return actions
    }


    /**
     * 
     * @param service 
     * @param resource 
     * @param privilegeLevels 
     * @returns 
     */
    addActionsForResource( props: AddActionsForResourceParams ): StatementGenerator {

        this.statement.action.push( ...this.getActionsForResource( props ) )

        return this
    }

    getActionsForResource( { service, resource, privilegeLevels }: AddActionsForResourceParams ): string[] {
        const actions: string[] = []
        const resourceDefinition = this.iamDefinition.resources[ service ][ resource ]

        for ( let privilegeLevel of privilegeLevels ) {
            for ( let action in resourceDefinition[ privilegeLevel ] ) {

                let privilege = resourceDefinition[ privilegeLevel ][ action ]
                actions.push( `${service}:${privilege.privilege}` )
            }
        }

        return actions
    }

    /**
     * Used if you want to add individual actions that don't fit in with the other permission levels that
     * are assigned more broadly
     * @param actions 
     * @returns 
     */
    addSpecificActions( actions: string[] ): void {
        this.statement.action.push( ...actions )

    }



    /**
     * 
     * @returns 
     */
    addDependentActions(): StatementGenerator {
        const policyActions: string[] = this.statement.action


        for ( let action of policyActions ) {

            // Since an action is in the form of service:Privilege, we need to split it to check the privileges
            // Assuming an action is in the right format like s3:CreateBucket, the 0th index will be the service
            // and the 1st index will be the privilege
            let splitAction = action.split( ':' )
            let privilege = this.iamDefinition.privileges[ splitAction[ 0 ] ][ camelPrivName( splitAction[ 1 ] ) ]

            if ( privilege.dependentActions.length > 0 ) {
                this.statement.action.push( ...privilege.dependentActions )
            }
        }


        return this
    }

    /**
     * Generates a list of of all conditions that are allowed for the various resources/actions that are 
     * in the policy
     */
    getAllowedConditions(): void {

        const policyActions: string[] = this.statement.action

        for ( let action of policyActions ) {
            let splitAction = action.split( ':' )
            // The name format used in the IAM definition object is Camel Case, but AWS actions are Pascal Case
            // This converts the action to Camel Case(ie: CreateBucket -> createBucket) for use as a key
            let privilege = this.iamDefinition.privileges[ splitAction[ 0 ] ][ camelPrivName( splitAction[ 1 ] ) ]

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
     * Checks for conditions that are in the policy but not actually allowed for any service/action/resource
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
     * Check if depedent actions are higher privilege level than the privileges allowed
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
        return this.statement
    }



}