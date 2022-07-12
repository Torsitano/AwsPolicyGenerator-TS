import { Statement } from './../src/awsPolicyGenerator/statementComponents/Statement'



const statement = new Statement( 'Allow' )
    .addActionsForResource( {
        service: 'iam',
        resource: 'role',
        privLevels: [ 'readPrivileges', 'listPrivileges' ],
        resourceArn: 'arn:aws:iam::123456789123:role/myiamrole'
    } )
    .addActions( [ 's3:CreateBucket', 'kms:CreateKey', 's3:ListAllMyBuckets' ] )

// const statement = new Statement( 'Allow' )
//     .addActions( [ 's3:CreateBucket', 's3:ListAllMyBuckets' ] )

console.log( statement.toYaml() )


