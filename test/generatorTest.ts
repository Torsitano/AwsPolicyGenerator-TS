import { AwsPolicyGenerator } from './../src/awsPolicyGenerator/awsPolicyGenerator'
import { PolicyStatement } from '../src/awsPolicyGenerator/interfaces'


const genTest: PolicyStatement = new AwsPolicyGenerator()
    .addActionsForResource( { service: 'iam', resource: 'role', privilegeLevels: [ 'readPrivileges', 'listPrivileges' ] } )
    .build()

console.log( JSON.stringify( genTest, null, 4 ) )