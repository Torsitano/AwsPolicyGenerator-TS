import { Statement } from './../src/awsPolicyGenerator/statementComponents/Statement'



const statement = new Statement( 'Allow' )
    .addActionsForResourceType( { service: 'iam', resource: 'role', privLevels: [ 'readPrivileges', 'listPrivileges' ] } )
    .addActions( [ 's3:CreateBucket', 'kms:CreateKey', 's3:ListAllMyBuckets' ] )

console.log( statement.toYaml() )


