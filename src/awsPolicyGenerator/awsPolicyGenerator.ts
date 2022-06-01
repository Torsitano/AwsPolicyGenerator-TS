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

    addActions(actions: string[]) {
        this.policyStatement.action.push(...actions)
    }

    checkConditions() {

    }

    build() {

        this.checkConditions()

        this.policyStatement.action = this.policyStatement.action.sort()
        console.log(this.allowedConditions)
        return this.policyStatement
    }



}