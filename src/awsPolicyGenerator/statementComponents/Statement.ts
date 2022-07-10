import { NormalizedDefinition, AddActionsForResourceParams, PolicyStatement, AccessLevel } from '../interfaces/interfaces'
import { Action } from './Action'
import { Condition } from './Condition'
import { Resource } from './Resource'
import * as fs from 'fs'
import { camelize } from 'humps'
import { parse, stringify } from 'yaml'


export type Effect = 'Allow' | 'Deny'

const iamDefinition: NormalizedDefinition = JSON.parse( fs.readFileSync( `./lib/normalizedDefinition.json`, 'utf-8' ) )

export class Statement {
    public effect: Effect
    public conditions: Condition[] = []
    public actions: Action[] = []
    public resources: Resource[] = []
    public allowedConditions: Set<string> = new Set<string>()
    public accessLevels: Set<AccessLevel> = new Set<AccessLevel>()
    public affectedResources: Set<string> = new Set<string>()


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
     * @param props 
     * @returns 
     */
    public addActionsForResource( props: AddActionsForResourceParams ): Statement {
        let resource = new Resource( iamDefinition.resources[ props.service ][ props.resource ] )

        for ( let privLevel of props.privLevels ) {
            for ( let privilege of resource[ privLevel ] ) {
                this.createAction( props.service, privilege )
            }
        }
        this.resources.push( resource )

        return this
    }

    private static actionSplit( action: string ): [ string, string ] {
        let service = action.split( ':' )[ 0 ]
        let privilege = action.split( ':' )[ 1 ]

        return [ service, privilege ]
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

        for ( let condition of action.allowedConditions ) {
            this.allowedConditions.add( condition )
        }

        this.accessLevels.add( action.accessLevel )
        this.actions.push( action )

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
    public getActions(): string[] {
        const actionList: string[] = []

        for ( let action of this.actions ) {
            actionList.push( action.action )
        }

        return actionList
    }

    public getDependentActions(): string[] {
        const dependentActions: string[] = []

        for ( let action of this.actions ) {
            dependentActions.push( ...action.dependentActions )
        }
        return dependentActions
    }

    public getResources(): string[] {

        return [ '*' ]
    }


    public build(): PolicyStatement {

        this.addDependentActions()


        const policyStatement: PolicyStatement = {
            effect: this.effect,
            action: this.getActions(),
            resource: this.getResources()
        }

        return policyStatement
    }

    public toJson(): string {
        return JSON.stringify( this.build(), null, 4 )
    }

    public toYaml(): string {
        return stringify( this.build() )
    }

}