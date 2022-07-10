# AWS Policy Generator

Still very, very WIP. Stay tuned

# Statement

Creates and provides information about Policy Statements

## Creating new statements

Create a new Statement object, adding permissions based on resource, specific actions, or service. The process gathers additional information about actions and resources to identify what conditions are allowed, dependent actions, etc.

```typescript
import { Statement } from './src/awsPolicyGenerator/statementComponents/Statement'

const statement = new Statement('Allow')
    .addActionsForResource({ service: 'iam', resource: 'role', privLevels: ['readPrivileges', 'listPrivileges'] })
    .addSpecificActions(['iam:CreateRole', 'kms:CreateKey'])

console.log(statement.accessLevels)
// -> Set(4) { 'Read', 'List', 'Permissions management', 'Write' }

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

## Outputing Statements

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
