import { PolicyStatement } from '../src/awsPolicyGenerator/interfaces/interfaces'
import { StatementGenerator } from '../src/awsPolicyGenerator/StatementGenerator'


const genTest: PolicyStatement = new StatementGenerator()
    .addActionsForResource( { service: 'iam', resource: 'role', privilegeLevels: [ 'listPrivileges' ] } )
    .addActionsForService( { service: 's3', privilegeLevels: [ 'listPrivileges', 'writePrivileges', 'tagPrivileges' ] } )
    .build()

console.log( JSON.stringify( genTest, null, 4 ) )