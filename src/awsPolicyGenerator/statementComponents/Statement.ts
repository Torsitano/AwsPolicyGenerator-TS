import { StatementCondition } from './../interfaces/interfaces'
import { NormalizedDefinition, PolicyStatement, AccessLevel, AddActionsForResourceParams } from '../interfaces/interfaces'
import { Action, ResourceOnAction } from './Action'
import { Condition } from './Condition'
import { Resource } from './Resource'
import * as fs from 'fs'
import { camelize } from 'humps'
import { parse, stringify } from 'yaml'
import { PolicyStatement as CdkPolicyStatement } from 'aws-cdk-lib/aws-iam'


export type Effect = 'Allow' | 'Deny'

const iamDefinition: NormalizedDefinition = JSON.parse( fs.readFileSync( `./lib/normalizedDefinition.json`, 'utf-8' ) )


const globalServices: string[] = [ 'account', 'cloudfront', 'iam', 's3' ]

export class Statement {
    public readonly effect: Effect
    public readonly includeRequiredResources: boolean
    private readonly conditions: Condition[] = []
    private readonly actions: Action[] = []
    private readonly resources: Resource[] = []
    public readonly allowedConditions: Set<string> = new Set<string>()
    public readonly accessLevels: Set<AccessLevel> = new Set<AccessLevel>()
    public readonly affectedResources: Set<string> = new Set<string>()


    constructor ( effect: Effect, includeRequiredResources: boolean = false ) {
        this.effect = effect
        this.includeRequiredResources = includeRequiredResources
    }

    /**
     * Creates a new Statement object from a JSON IAM policy statement
     * @param jsonStatement 
     * @returns 
     */
    public static fromJson( jsonStatement: string ): Statement {
        const parsedStatement: PolicyStatement = JSON.parse( jsonStatement )
        return Statement.buildFrom( parsedStatement )
    }

    /**
     * Creates a new Statement object from a YAML IAM policy statement
     * @param yamlStatement 
     * @returns 
     */
    public static fromYaml( yamlStatement: string ): Statement {
        const parsedStatement: PolicyStatement = parse( yamlStatement )
        return Statement.buildFrom( parsedStatement )
    }

    /**
     * Creates a new Statement object from a parsed PolicyStatement
     * Used to generate new Statement objects for the Policy class
     * @param parsedStatement 
     * @returns 
     */
    public static buildFrom( parsedStatement: PolicyStatement ): Statement {

        const returnStatement = new Statement( parsedStatement.effect )
        returnStatement.addActions( parsedStatement.action )

        for ( let resource of parsedStatement.resource ) {
            if ( resource === '*' ) {
                continue
            }
            let resourceInfo = Statement.parseResourceArn( resource )
            if ( resourceInfo.resource != '*' ) {
                returnStatement.addResource( resourceInfo.service, resourceInfo.resource )
            }
        }

        return returnStatement
    }

    /**
     * 
     * @param action 
     * @returns 
     */
    private static actionSplit( action: string ): [ string, string ] {
        let service = action.split( ':' )[ 0 ]
        let privilege = action.split( ':' )[ 1 ]

        return [ service, privilege ]
    }

    /**
     * 
     */
    private static parseResourceArn( arn: string ): { service: string, resource: string } {
        const item: { service: string, resource: string } = { service: '', resource: '' }

        item.service = arn.split( ':' )[ 2 ]
        item.resource = arn.split( ':' )[ 5 ].split( '/' )[ 0 ]

        return item
    }

    /**
     * 
     * @param props 
     * @returns 
     */
    public addActionsForResource( props: AddActionsForResourceParams ): Statement {
        let resource = this.createResource( props.service, props.resource, props.resourceArn )

        for ( let privLevel of props.privLevels ) {
            for ( let privilege of resource[ privLevel ] ) {
                this.createAction( props.service, privilege )
            }
        }
        this.resources.push( resource )

        return this
    }

    public addResource( service: string, resource: string ): void {
        const createdResource = this.createResource( service, resource )
        const check = this.resources.some(
            item => item.arn === createdResource.arn
        )

        if ( !check ) {
            this.resources.push( createdResource )
        }
    }

    /**
     * 
     * @param service 
     * @param resource 
     * @returns 
     */
    private createResource( service: string, resource: string, resourceArn?: string ): Resource {
        const createdResource = new Resource( iamDefinition.resources[ service ][ resource ], resourceArn )
        this.addConditions( createdResource )
        this.resources.push( createdResource )

        return createdResource
    }


    /**
     * 
     * @param item 
     */
    private addConditions( item: Resource | Action ): void {
        for ( let condition of item.allowedConditions ) {
            this.allowedConditions.add( condition )
        }
    }

    /**
     * 
     * @param actions 
     * @returns 
     */
    public addActions( actions: string[] ): Statement {
        for ( let action of actions ) {
            const [ service, privilege ] = Statement.actionSplit( action )

            this.createAction( service, privilege )

        }

        return this
    }

    /**
     * 
     * @param service 
     * @param privilege 
     * @returns 
     */
    private createAction( service: string, privilege: string ): Action {

        const action = new Action( iamDefinition.privileges[ service ][ camelize( privilege ) ] )
        this.addConditions( action )

        this.accessLevels.add( action.accessLevel )

        // Checks to see if there is already an action of this type in the statement
        const check = this.actions.some( item => item.action === action.action )

        // If there is, it won't be added to the array
        if ( !check ) {
            this.actions.push( action )
        }

        return action
    }

    /**
     * 
     */
    private addDependentActions(): void {
        const actionList = this.getActions()
        const dependentActions = this.getDependentActions()

        for ( let dependentAction of dependentActions ) {
            if ( !actionList.includes( dependentAction ) ) {

                const [ service, privilege ] = Statement.actionSplit( dependentAction )
                this.createAction( service, privilege )
                actionList.push( dependentAction )

                //console.log( `Added Dependent Action ${dependentAction}` )
            }
        }
    }

    /**
     * 
     * @returns 
     */
    public getDependentActions(): string[] {
        const dependentActions: string[] = []

        for ( let action of this.actions ) {
            dependentActions.push( ...action.dependentActions )
        }
        return dependentActions.sort()
    }

    /**
     * 
     */
    //@ts-ignore
    private addRequiredResources(): void {
        const requiredResources = Action.getRequiredResources( this.actions )

        const resourcesToAdd: ResourceOnAction[] = []

        for ( let requiredResource of requiredResources ) {
            // Get the service from the Resource ARN

            let match = false
            const currentResources = this.getResourceArns()
            for ( let currentResource of currentResources ) {
                if ( this.compareArns( currentResource, requiredResource.resourceArn ) ) {
                    match = true
                }
            }

            if ( !match ) {
                resourcesToAdd.push( requiredResource )
            }
        }
        if ( this.includeRequiredResources ) {
            console.log( `The following resources were listed as required and automatically added:\n` )
            resourcesToAdd.map( ( resource: ResourceOnAction ): void => {
                console.log( resource.resourceName )
                let service = resource.resourceArn.split( ':' )[ 2 ]
                this.createResource( service, resource.resourceName )
            } )
        } else {
            console.log( `The following resources are listed as required but were not included:\n` )
            resourcesToAdd.map( ( resource: ResourceOnAction ): void => {
                console.log( resource.resourceName )
            } )
        }

    }


    // TODO: Add check for Account as well
    /**
     * This method will check the service and resource types of ARNs to determine if a new wildcard ARN should be 
     * added to the statement. If a specific Resource ARN has been passed in, only that ARN will be in the statement.
     * If no Resource ARN has been passed in that is a required resource for an Action, then a wildcard ARN will
     * be added.
     * @param arn1 
     * @param arn2 
     * @returns 
     */
    private compareArns( arn1: string, arn2: string ): boolean {

        const arn1Service = arn1.split( ':' )[ 2 ]
        const arn1ResourceType = arn1.split( ':' )[ 5 ].split( '/' )[ 0 ]

        const arn2Service = arn2.split( ':' )[ 2 ]
        const arn2ResourceType = arn2.split( ':' )[ 5 ].split( '/' )[ 0 ]

        return ( ( arn1Service == arn2Service ) && ( ( arn1ResourceType == arn2ResourceType ) || ( arn1ResourceType == '*' ) ) )
    }


    // /**
    //  * 
    //  * @returns 
    //  */
    // public getRequiredResources(): ResourceOnAction[] {
    //     const requiredResources: ResourceOnAction[] = []

    //     for ( let action of this.actions ) {
    //         for ( let resource of action.resources ) {
    //             if ( resource.required ) {
    //                 const check = requiredResources.some(
    //                     item => item.resourceArn === resource.resourceArn
    //                 )

    //                 if ( !check ) {
    //                     requiredResources.push( resource )
    //                 }
    //             }
    //         }
    //     }

    //     return requiredResources.sort()
    // }

    /**
     * 
     */
    private addServicesForActions(): string[] {
        const serviceArns: string[] = []

        const actions = this.getActionsWithoutResource()
        for ( let action of actions ) {

            if ( action.service === 's3' ) {
                let serviceArn = `arn:\${Partition}:${action.service}:::*`

                if ( !serviceArns.includes( serviceArn ) ) {
                    serviceArns.push( serviceArn )
                }
                continue
            }

            if ( globalServices.includes( action.service ) ) {
                let serviceArn = `arn:\${Partition}:${action.service}::\${Account}:*`

                if ( !serviceArns.includes( serviceArn ) ) {
                    serviceArns.push( serviceArn )
                }

            } else {
                let serviceArn = `arn:\${Partition}:${action.service}:\${Region}:\${Account}:*`

                if ( !serviceArns.includes( serviceArn ) ) {
                    serviceArns.push( serviceArn )
                }
            }
        }

        return serviceArns
    }

    /**
     * 
     * @returns 
     */
    public getActions(): string[] {
        const actionList: string[] = []

        for ( let action of this.actions ) {
            actionList.push( action.action )
        }

        return actionList.sort()
    }

    /**
     * 
     */
    public getActionsWithoutResource(): Action[] {
        const actions: Action[] = []

        for ( let action of this.actions ) {
            if ( Object.keys( action.resources ).length === 0 ) {
                actions.push( action )
            }
        }

        return actions
    }


    /**
     * 
     * @returns 
     */
    public getResources(): string[] {
        const resourceList: string[] = []

        for ( let resource of this.resources ) {
            resourceList.push( resource.resource )
        }

        return resourceList
    }

    /**
     * Returns a list of all possible resources that can be affected by the actions on the statement
     * @returns 
     */
    public getAllResourcesForActions(): ResourceOnAction[] {
        const resourceList: ResourceOnAction[] = []

        for ( let action of this.actions ) {
            for ( let resource of action.resources ) {
                const check = resourceList.some(
                    item => item.resourceArn === resource.resourceArn
                )
                if ( !check ) {
                    resourceList.push( resource )
                }
            }

        }

        return resourceList
    }

    /**
     * 
     * @returns A list of all the ARNs from the resources that exist on the statement object
     */
    public getResourceArns(): string[] {
        const arns: string[] = []

        for ( let resource of this.resources ) {
            if ( !arns.includes( resource.arn ) ) {
                arns.push( resource.arn )
            }
        }
        arns.push( ...this.addServicesForActions() )

        return arns.sort()
    }

    /**
     * 
     * @param condition 
     * @param override 
     * @returns 
     */
    public addCondition( condition: string, override: boolean = false ): void {
        if ( !this.allowedConditions.has( condition ) && override == false ) {
            console.error(
                `Condition '${condition}' is not allowed with the current set of actions and resources.` +
                `\n If you would like to override this and add it anyway, pass a second argument of boolean true.`
            )
            return
        }

        this.conditions.push( new Condition( iamDefinition.conditions[ condition ] ) )

    }

    public getConditions(): StatementCondition {
        const conditions: StatementCondition = {}
        for ( let condition of this.conditions ) {
            conditions[ condition.condition ] = {}
        }

        return conditions
    }


    /**
     * 
     * @returns 
     */
    public build(): PolicyStatement {

        this.addDependentActions()
        this.addRequiredResources()

        const policyStatement: PolicyStatement = {
            effect: this.effect,
            action: this.getActions(),
            resource: this.getResourceArns()
        }

        if ( this.conditions.length > 0 ) {
            policyStatement.condition = this.getConditions()
        }

        return policyStatement
    }

    /**
     * 
     * @returns 
     */
    public toJson(): string {
        return JSON.stringify( this.build(), null, 4 )
    }

    /**
     * 
     * @returns 
     */
    public toYaml(): string {
        return stringify( this.build() )
    }

    public toCdk(): CdkPolicyStatement {
        const statement = new CdkPolicyStatement( {

        } )

        return statement
    }

}