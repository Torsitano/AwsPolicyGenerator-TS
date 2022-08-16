import { Statement } from './../src/awsPolicyGenerator/statementComponents/Statement'



const statement = new Statement( 'Allow' )
    .addActionsForResource( {
        service: 'iam',
        resource: 'role',
        privLevels: [ 'readPrivileges', 'listPrivileges' ],
        resourceArn: 'arn:aws:iam::123456789123:role/myiamrole'
    } )
//.addActions( [ 's3:CreateBucket', 'kms:CreateKey', 's3:ListAllMyBuckets' ] )

// const statement = new Statement( 'Allow' )
//     .addActions( [ 's3:CreateBucket', 's3:ListAllMyBuckets' ] )

console.log( statement.toYaml() )


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