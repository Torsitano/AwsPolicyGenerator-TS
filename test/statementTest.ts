import { PrivilegeLevel } from '../src/awsPolicyGenerator/interfaces/interfaces'
import { Statement, Effect } from './../src/awsPolicyGenerator/statementComponents/Statement'

//@ts-ignore
const privLevels: PrivilegeLevel[] = [ 'readPrivileges', 'listPrivileges', 'tagPrivileges', 'writePrivileges', 'permManPrivileges' ]

const statement = new Statement( Effect.ALLOW, true ).addActionsForResource( {
    service: 'ec2',
    resource: 'instance',
    privLevels: privLevels
} )

// .addActionsForResource( {
//     service: 'ec2',
//     resource: 'vpc',
//     privLevels: privLevels
// } )
// .addActionsForResource( {
//     service: 'ec2',
//     resource: 'subnet',
//     privLevels: privLevels
// } )

const yamlOutput = statement.toYaml()

console.log( yamlOutput )

// const statement = new Statement( 'Allow' )
//     .addActions( [ 's3:CreateBucket', 's3:ListAllMyBuckets' ] )


//console.log( statement.resources )

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