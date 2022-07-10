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

// const statement = new Statement( 'Allow' )
//     .addActionsForResource( { service: 'kms', resource: 'key', privLevels: [ 'listPrivileges' ] } )

// console.dir( statement.build(), { depth: null, } )

// console.log( statement.toJson() )

console.log( '\n\n' )

const jsonStatement = Statement.fromJson( json )

console.dir( jsonStatement, { depth: null } )

console.log( jsonStatement.allowedConditions )