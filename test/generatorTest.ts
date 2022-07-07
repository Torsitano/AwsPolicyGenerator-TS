//import { PolicyStatement } from '../src/awsPolicyGenerator/interfaces/interfaces'
import { Statement } from '../src/awsPolicyGenerator/Statement'
import { StatementGenerator } from '../src/awsPolicyGenerator/StatementGenerator'


const genTest: Statement = new StatementGenerator()
    .addActionsForResource( { service: 'iam', resource: 'role', privilegeLevels: [ 'listPrivileges' ] } )
    .addActionsForService( { service: 's3', privilegeLevels: [ 'listPrivileges' ] } )
    .build()



console.log( genTest.toJson() )