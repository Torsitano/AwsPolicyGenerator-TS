# AWS Policy Generator

Still very, very WIP. Stay tuned

Example(`./test/generatorTest.ts`):

```typescript
import { PolicyStatement } from '../src/awsPolicyGenerator/interfaces/interfaces'
import { PolicyStatementGenerator } from '../src/awsPolicyGenerator/PolicyStatementGenerator'

const genTest: PolicyStatement = new PolicyStatementGenerator()
    .addActionsForResource({ service: 'iam', resource: 'role', privilegeLevels: ['readPrivileges', 'listPrivileges'] })
    .build()

console.log(JSON.stringify(genTest, null, 4))
```

Output:

```json
{
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
