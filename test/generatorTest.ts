import { AwsPolicyGenerator } from './../src/awsPolicyGenerator/awsPolicyGenerator';
import { PolicyStatement } from '../src/awsPolicyGenerator/interfaces'

//@ts-ignore
const genTest: PolicyStatement = new AwsPolicyGenerator()
    .addActionsForResource('iam', 'role', ['readPrivileges','listPrivileges'])
    .build()

//console.log(genTest)