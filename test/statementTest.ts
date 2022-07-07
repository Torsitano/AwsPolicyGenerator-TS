import { Statement } from './../src/awsPolicyGenerator/Statement'
const yamlStatement = `
effect: Allow
action:
  - iam:ListAttachedRolePolicies
  - iam:ListInstanceProfilesForRole
  - iam:ListPoliciesGrantingServiceAccess
  - iam:ListRolePolicies
  - iam:ListRoleTags
  - s3:ListAccessPoints
  - s3:ListAccessPointsForObjectLambda
  - s3:ListAllMyBuckets
  - s3:ListBucket
  - s3:ListBucketMultipartUploads
  - s3:ListBucketVersions
  - s3:ListJobs
  - s3:ListMultiRegionAccessPoints
  - s3:ListMultipartUploadParts
  - s3:ListStorageLensConfigurations
resource:
  - "*"
`

const statement = new Statement()

statement.fromYaml( yamlStatement )

console.log( statement.statement )