import { NormalizedDefinition, AddActionsForResourceParams, PolicyStatement, AccessLevel } from '../interfaces/interfaces'
import { Action, ResourceOnAction } from './Action'
import { Condition } from './Condition'
import { Resource } from './Resource'
import * as fs from 'fs'
import { camelize } from 'humps'
import { parse, stringify } from 'yaml'


export type Effect = 'Allow' | 'Deny'

const iamDefinition: NormalizedDefinition = JSON.parse( fs.readFileSync( `./lib/normalizedDefinition.json`, 'utf-8' ) )

export class Statement {
    public readonly effect: Effect
    //@ts-ignore
    private readonly conditions: Condition[] = []
    private readonly actions: Action[] = []
    private readonly resources: Resource[] = []
    public readonly allowedConditions: Set<string> = new Set<string>()
    public readonly accessLevels: Set<AccessLevel> = new Set<AccessLevel>()
    public readonly affectedResources: Set<string> = new Set<string>()


    constructor ( effect: Effect ) {
        this.effect = effect
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
        returnStatement.addSpecificActions( parsedStatement.action )

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
     * @param props 
     * @returns 
     */
    public addActionsForResource( props: AddActionsForResourceParams ): Statement {
        let resource = this.createResource( props.service, props.resource )

        for ( let privLevel of props.privLevels ) {
            for ( let privilege of resource[ privLevel ] ) {
                this.createAction( props.service, privilege )
            }
        }
        this.resources.push( resource )

        return this
    }

    /**
     * 
     * @param service 
     * @param resource 
     * @returns 
     */
    private createResource( service: string, resource: string ): Resource {
        const createdResource = new Resource( iamDefinition.resources[ service ][ resource ] )
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
    public addSpecificActions( actions: string[] ): Statement {
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

                console.log( `Added Dependent Action ${dependentAction}` )
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
    private addRequiredResources(): void {
        const requiredResources = this.getRequiredResources()

        for ( let requiredResource of requiredResources ) {
            // Get the service from the Resource ARN
            let service = requiredResource.resourceArn.split( ':' )[ 2 ]
            this.createResource( service, requiredResource.resourceName )
        }
    }

    /**
     * 
     * @returns 
     */
    public getRequiredResources(): ResourceOnAction[] {
        const requiredResources: ResourceOnAction[] = []

        for ( let action of this.actions ) {
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
                const check = resourceList.some( item => item.resourceArn === resource.resourceArn )
                if ( !check ) {
                    resourceList.push( resource )
                }
            }

        }

        return resourceList
    }

    /**
     * 
     * @returns 
     */
    public getResourceArns(): string[] {
        const arns: string[] = []

        for ( let resource of this.resources ) {
            if ( !arns.includes( resource.arn ) ) {
                arns.push( resource.arn )
            }
        }

        if ( arns.length === 0 ) {
            return [ '*' ]
        }

        return arns.sort()
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

}