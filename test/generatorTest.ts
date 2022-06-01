import { AwsPolicyGenerator } from './../src/awsPolicyGenerator/awsPolicyGenerator';
import { PolicyStatement } from '../src/awsPolicyGenerator/interfaces'

const genTest: PolicyStatement = new AwsPolicyGenerator()
    .addActionsForResource('iam', 'role', ['readPrivileges','listPrivileges'])
    .build()

console.log(genTest)