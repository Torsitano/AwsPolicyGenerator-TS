import { Statement, Effect } from './../src/awsPolicyGenerator/statementComponents/Statement'



const statement = new Statement( Effect.ALLOW, true )
    // .addActionsForResource( {
    //     service: 'iam',
    //     resource: 'role',
    //     privLevels: [ 'readPrivileges', 'listPrivileges' ],
    //     resourceArn: 'arn:aws:iam::123456789123:role/myiamrole'
    // } )
    .addActions( [ 'ec2:RunInstances' ] )

// const statement = new Statement( 'Allow' )
//     .addActions( [ 's3:CreateBucket', 's3:ListAllMyBuckets' ] )


//console.log( statement.resources )

//@ts-ignore
const yamlOutput = statement.toYaml()

console.log( yamlOutput )

//console.log( statement.toYaml() )


// const yaml = `
// effect: Allow
// action:
//   - iam:CreateServiceLinkedRole
//   - iam:GenerateServiceLastAccessedDetails
//   - iam:GetContextKeysForPrincipalPolicy
//   - iam:GetRole
//   - iam:GetRolePolicy
//   - iam:GetServiceLinkedRoleDeletionStatus
//   - iam:ListAttachedRolePolicies
//   - iam:ListInstanceProfilesForRole
//   - iam:ListPoliciesGrantingServiceAccess
//   - iam:ListRolePolicies
//   - iam:ListRoleTags
//   - iam:SimulatePrincipalPolicy
//   - kms:CreateKey
//   - kms:PutKeyPolicy
//   - kms:TagResource
//   - s3:CreateBucket
//   - s3:ListAllMyBuckets
// resource:
//   - '*'
// `

// const statement = Statement.fromYaml( yaml )

// console.log( statement.allowedConditions )