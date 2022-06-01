import { NormalizedDefinition, PolicyStatement } from "./interfaces"
import * as fs from 'fs'

export enum Service {
    IAM = 'iam',
    EC2 = 'ec2'
}

type privilegeLevel = 'listPrivileges' | 'readPrivileges' | 'writePrivileges' | 'permManPrivileges' | 'tagPrivileges'


export class AwsPolicyGenerator {
    private readonly policyStatement: PolicyStatement
    private readonly iamDefinition: NormalizedDefinition
    private readonly allowedConditions: string[]

    constructor() {
        this.policyStatement = {
            version: '2012-10-17',
            effect: 'Allow',
            action: []
        }

        this.iamDefinition = JSON.parse(fs.readFileSync(`./lib/normalizedDefinition.json`, 'utf-8'))

        this.allowedConditions = []
    }

    //@ts-ignore
    addActionsForService(services: string): AwsPolicyGenerator {


        return this
    }


    /**
     * 
     * @param service 
     * @param resource 
     * @param privilegeLevels 
     * @returns 
     */
    addActionsForResource(service: string, resource: string, privilegeLevels: privilegeLevel[]): AwsPolicyGenerator {
        
        const resourceDefinition = this.iamDefinition.resources[service][resource]

        for (let condition in resourceDefinition.resourceConditions) {
            this.allowedConditions.push(condition)
        }

        for (let privilegeLevel of privilegeLevels) {
            for (let action in resourceDefinition[privilegeLevel]) {

                let privilege = resourceDefinition[privilegeLevel][action]
                this.policyStatement.action.push(`${service}:${privilege.privilege}`)

                if (privilege.dependentActions.length > 0) {
                    this.policyStatement.action.push(...privilege.dependentActions)
                }
                for (let condition in privilege.privConditions) {
                    this.allowedConditions.push(condition)
                }
            }
        }

        return this
    }

    /**
     * 
     * @param actions 
     * @returns 
     */
    addSpecificActions(actions: string[]): AwsPolicyGenerator {
        this.policyStatement.action.push(...actions)

        return this
    }

    /**
     * 
     * @returns 
     */
    addDependentActions(): AwsPolicyGenerator {
        const policyActions: string[] = this.policyStatement.action

        for (let action of policyActions) {

            // Since an action is in the form of service.Privilege, we need to split it to check the privileges
            // Assuming an action is in the right format like s3:CreateBucket, the 0th index will be the service
            // and the 1st index will be the privilege
            let splitAction = action.split(':')
            let privilege = this.iamDefinition.privileges[splitAction[0]][splitAction[1]]

            if (privilege.dependentActions.length > 0) {
                this.policyStatement.action.push(...privilege.dependentActions)
            }
        }

        return this
    }


    /**
     * 
     * @returns 
     */
    checkConditions(): void {
        if (!this.policyStatement.condition) {
            return
        }

        for (let condition of this.policyStatement.condition) {
            if (!this.allowedConditions.includes(condition)) {
                throw new Error('Condition added that is not allowed')
            }
        }

        return
    }

    /**
     * 
     */
    build(): PolicyStatement {

        this.checkConditions()
        this.addDependentActions()

        this.policyStatement.action = this.policyStatement.action.sort()
        console.log(this.allowedConditions)
        return this.policyStatement
    }



}