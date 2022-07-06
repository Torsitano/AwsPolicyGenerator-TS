import { PolicyStatement } from '../src/awsPolicyGenerator/interfaces/interfaces'
import { PolicyStatementGenerator } from '../src/awsPolicyGenerator/PolicyStatementGenerator'


const genTest: PolicyStatement = new PolicyStatementGenerator()
    .addActionsForResource( { service: 'iam', resource: 'role', privilegeLevels: [ 'readPrivileges', 'listPrivileges' ] } )
    .build()

console.log( JSON.stringify( genTest, null, 4 ) )