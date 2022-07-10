import { Statement } from './../src/awsPolicyGenerator/statementComponents/Statement'
// import { Statement } from './../src/awsPolicyGenerator/Statement'
// const yamlStatement = `
// effect: Allow
// action:
//   - iam:ListAttachedRolePolicies
//   - iam:ListInstanceProfilesForRole
//   - iam:ListPoliciesGrantingServiceAccess
//   - iam:ListRolePolicies
//   - iam:ListRoleTags
//   - s3:ListAccessPoints
//   - s3:ListAccessPointsForObjectLambda
//   - s3:ListAllMyBuckets
//   - s3:ListBucket
//   - s3:ListBucketMultipartUploads
//   - s3:ListBucketVersions
//   - s3:ListJobs
//   - s3:ListMultiRegionAccessPoints
//   - s3:ListMultipartUploadParts
//   - s3:ListStorageLensConfigurations
// resource:
//   - "*"
// `

// const statement = new Statement()

// statement.fromYaml( yamlStatement )

// console.log( statement.statement )

//@ts-ignore


// const statement = new Statement( 'Allow' )
//     .addActionsForResource( { service: 'iam', resource: 'role', privLevels: [ 'readPrivileges', 'listPrivileges' ] } )
//     .addSpecificActions( [ 'iam:CreateRole', 'kms:CreateKey' ] )


// console.log( statement.accessLevels )

// console.log( statement.allowedConditions )

// console.log( statement.getDependentActions() )

// console.dir( statement.build(), { depth: null, } )

// console.log( statement.toJson() )
// console.log( statement.toYaml() )

// console.log( '\n\n' )


// const statement = new Statement( 'Allow' )
//     .addActionsForResource( { service: 's3', resource: 'bucket', privLevels: [ 'readPrivileges', 'listPrivileges' ] } )
//     .toYaml()

// console.log( statement )


const json = `
{
    "effect": "Allow",
    "action": [
        "kms:ListGrants",
        "kms:ListKeyPolicies",
        "kms:ListResourceTags",
        "kms:ListRetirableGrants"
    ],
    "resource": [
        "*"
    ]
}
`

const yaml = `
effect: Allow
action:
  - s3:GetAccelerateConfiguration
  - s3:GetAnalyticsConfiguration
  - s3:GetBucketAcl
  - s3:GetBucketCORS
  - s3:GetBucketLocation
  - s3:GetBucketLogging
  - s3:GetBucketNotification
  - s3:GetBucketObjectLockConfiguration
  - s3:GetBucketOwnershipControls
  - s3:GetBucketPolicy
  - s3:GetBucketPolicyStatus
  - s3:GetBucketPublicAccessBlock
  - s3:GetBucketRequestPayment
  - s3:GetBucketTagging
  - s3:GetBucketVersioning
  - s3:GetBucketWebsite
  - s3:GetEncryptionConfiguration
  - s3:GetIntelligentTieringConfiguration
  - s3:GetInventoryConfiguration
  - s3:GetLifecycleConfiguration
  - s3:GetMetricsConfiguration
  - s3:GetReplicationConfiguration
  - s3:ListBucket
  - s3:ListBucketMultipartUploads
  - s3:ListBucketVersions
resource:
  - "*"
`

const statementFromJson = Statement.fromJson( json )
const statementFromYaml = Statement.fromYaml( yaml )

console.log( statementFromJson.accessLevels )

console.log( statementFromYaml.allowedConditions )