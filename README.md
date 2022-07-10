# AWS Policy Generator

# Still very, very WIP. Stay tuned

# Statement

Creates and provides information about Policy Statements

## Creating New Statements

Create a new Statement object, adding permissions based on resource, specific actions, or service. The process gathers additional information about actions and resources to identify what conditions are allowed, dependent actions, etc.

```typescript
import { Statement } from './src/awsPolicyGenerator/statementComponents/Statement'

const statement = new Statement('Allow')
    .addActionsForResource({ service: 'iam', resource: 'role', privLevels: ['readPrivileges', 'listPrivileges'] })
    .addSpecificActions(['iam:CreateRole', 'kms:CreateKey'])

console.log(statement.accessLevels)
// Set(4) { 'Read', 'List', 'Permissions management', 'Write' }

console.log(statement.allowedConditions)
/**
 * Set(13) {
 *    'aws:ResourceTag/${TagKey}',
 *    'iam:ResourceTag/${TagKey}',
 *    'aws:RequestTag/${TagKey}',
 *    'aws:TagKeys',
 *    'iam:PermissionsBoundary',
 *    'kms:BypassPolicyLockoutSafetyCheck',
 *    'kms:CallerAccount',
 *    'kms:KeyOrigin',
 *    'kms:KeySpec',
 *    'kms:KeyUsage',
 *    'kms:MultiRegion',
 *    'kms:MultiRegionKeyType',
 *    'kms:ViaService'
 * }
 */

console.log(statement.getDependentActions())
/**
 * [
 *   'iam:CreateServiceLinkedRole',
 *   'kms:PutKeyPolicy',
 *   'kms:TagResource'
 * ]
 */
```

## Outputing Policy Statements

After a statement had been created, it can be exported as JSON, YAML, or a Policy Statement Object. Notice that the dependent actions identified above were automatically added to the policy

`statement.toJson()`:

```json
{
    "effect": "Allow",
    "action": [
        "iam:GenerateServiceLastAccessedDetails",
        "iam:GetContextKeysForPrincipalPolicy",
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:GetServiceLinkedRoleDeletionStatus",
        "iam:SimulatePrincipalPolicy",
        "iam:ListAttachedRolePolicies",
        "iam:ListInstanceProfilesForRole",
        "iam:ListPoliciesGrantingServiceAccess",
        "iam:ListRolePolicies",
        "iam:ListRoleTags",
        "iam:CreateRole",
        "kms:CreateKey",
        "iam:CreateServiceLinkedRole",
        "kms:PutKeyPolicy",
        "kms:TagResource"
    ],
    "resource": ["*"]
}
```

`statement.toYaml()`:

```yaml
effect: Allow
action:
    - iam:GenerateServiceLastAccessedDetails
    - iam:GetContextKeysForPrincipalPolicy
    - iam:GetRole
    - iam:GetRolePolicy
    - iam:GetServiceLinkedRoleDeletionStatus
    - iam:SimulatePrincipalPolicy
    - iam:ListAttachedRolePolicies
    - iam:ListInstanceProfilesForRole
    - iam:ListPoliciesGrantingServiceAccess
    - iam:ListRolePolicies
    - iam:ListRoleTags
    - iam:CreateRole
    - kms:CreateKey
    - iam:CreateServiceLinkedRole
    - kms:PutKeyPolicy
    - kms:TagResource
resource:
    - '*'
```

`statement.build()`:

```typescript
{
  effect: 'Allow',
  action: [
    'iam:GenerateServiceLastAccessedDetails',
    'iam:GetContextKeysForPrincipalPolicy',
    'iam:GetRole',
    'iam:GetRolePolicy',
    'iam:GetServiceLinkedRoleDeletionStatus',
    'iam:SimulatePrincipalPolicy',
    'iam:ListAttachedRolePolicies',
    'iam:ListInstanceProfilesForRole',
    'iam:ListPoliciesGrantingServiceAccess',
    'iam:ListRolePolicies',
    'iam:ListRoleTags',
    'iam:CreateRole',
    'kms:CreateKey',
    'iam:CreateServiceLinkedRole',
    'kms:PutKeyPolicy',
    'kms:TagResource'
  ],
  resource: [ '*' ]
}
```

## Using Already Made Policy Statements

Existing statements can be parsed into a new Statement Object as well, for modification/validation/info gathering. This is done using static methods on the class.

```typescript
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

// Static methods on Statement class
const statementFromJson = Statement.fromJson(json)
const statementFromYaml = Statement.fromYaml(yaml)

console.log(statementFromJson.accessLevels)
// Set(1) { 'List' }

console.log(statementFromYaml.accessLevels)
// Set(2) { 'Read', 'List' }

console.log(statementFromYaml.allowedConditions)
/**
 * Set(10) {
 *    's3:ResourceAccount',
 *    's3:TlsVersion',
 *    's3:authType',
 *    's3:signatureAge',
 *    's3:signatureversion',
 *    's3:AccessPointNetworkOrigin',
 *    's3:DataAccessPointAccount',
 *    's3:DataAccessPointArn',
 *    's3:delimiter',
 *    's3:prefix'
 * }
 */
```
