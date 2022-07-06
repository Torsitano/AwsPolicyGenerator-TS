# AWS Policy Generator

Still very, very WIP. Stay tuned

Example(`./test/generatorTest.ts`):

```typescript
import { AwsPolicyGenerator } from './../src/awsPolicyGenerator/awsPolicyGenerator'
import { PolicyStatement } from '../src/awsPolicyGenerator/interfaces'

const genTest: PolicyStatement = new AwsPolicyGenerator()
    .addActionsForResource({ service: 'iam', resource: 'role', privilegeLevels: ['readPrivileges', 'listPrivileges'] })
    .build()

console.log(JSON.stringify(genTest, null, 4))
```

Output:

```json
{
    "version": "2012-10-17",
    "effect": "Allow",
    "action": [
        "iam:GenerateServiceLastAccessedDetails",
        "iam:GetContextKeysForPrincipalPolicy",
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:GetServiceLinkedRoleDeletionStatus",
        "iam:ListAttachedRolePolicies",
        "iam:ListInstanceProfilesForRole",
        "iam:ListPoliciesGrantingServiceAccess",
        "iam:ListRolePolicies",
        "iam:ListRoleTags",
        "iam:SimulatePrincipalPolicy"
    ],
    "resource": ["*"]
}
```
