# AWS Policy Generator

Generate AWS IAM identity policies by choosing a service and one or more access levels. A grant can cover a whole service, a resource type, a specific resource ARN, or an ARN pattern. The bundled catalog supplies the matching actions.

## Use in an AWS CDK stack

Chain `Policy.grant()` calls in your TypeScript stack, then call `toCdk()` for a native `iam.PolicyDocument`. In this example, `orders` is a DynamoDB table, `inbox` is an S3 bucket, and `workerRole` is the IAM role for the application.

```ts
import * as iam from 'aws-cdk-lib/aws-iam'
import { Policy } from 'awspolicygenerator-ts'

// Inside the CDK stack constructor
const document = new Policy()
    .grant({ service: 'dynamodb', resource: 'table', access: ['Read'], arn: orders.tableArn })
    .grant({ service: 's3', resource: 'object', access: ['Write'], arn: inbox.arnForObjects('uploads/*') })
    .grant({ service: 'cloudwatch', access: ['Read', 'List'] })
    .toCdk()

new iam.Policy(this, 'WorkerAccess', { document, roles: [workerRole] })
```

The first grant binds reads to the table created by the stack. The second binds writes to the bucket's uploads prefix. The third covers CloudWatch across resources. You can also pass the document to a role's `inlinePolicies`, or pass `Statement.toCdk()` to `role.addToPrincipalPolicy()` when you need one statement.

The library uses your app's `aws-cdk-lib` v2 peer dependency. CDK preserves references such as `orders.tableArn` through synthesis and emits the corresponding CloudFormation intrinsics. For an opaque ARN token, the caller supplies its service and resource type. Literal ARNs and visible fields of assembled ARNs are checked against the catalog. [CDK PolicyDocument](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyDocument.html)

To install this checkout into a separate CDK app using Node 22 or newer, run `npm ci` and `npm pack` in the generator repository. Then run `npm install /path/to/awspolicygenerator-ts-0.2.0.tgz` in the CDK app.

## Use from the CLI

Use Node.js 22 or newer. From the repository root:

```sh
npm ci
npm run build
node dist/cli.js services
node dist/cli.js grant cloudwatch Read,List
node dist/cli.js grant sqs queue Write
node dist/cli.js grant dynamodb table Write 'arn:aws:dynamodb:us-east-1:123456789012:table/orders'
node dist/cli.js resources s3
node dist/cli.js explain s3 object Write
node dist/cli.js grant s3 object Write
node dist/cli.js grant s3 object Write 'arn:aws:s3:::media-inbox/uploads/*'
```

The last command prints a complete IAM policy to stdout. The selected actions include `s3:PutObject` and `s3:DeleteObject`. `s3:GetObject` belongs to Read, `s3:PutObjectTagging` to Tagging, and `s3:PutObjectAcl` to Permissions management. Write includes deletion. For an upload-only workflow, select individual actions.

| Intent | Example | IAM resource scope |
| --- | --- | --- |
| Whole service | `grant cloudwatch Read,List` | `*` with explicit CloudWatch Read and List actions |
| Every resource of a type | `grant sqs queue Write` | `arn:aws:sqs:*:*:*` across queues in the standard partition |
| One resource | `grant dynamodb table Write ARN` | The supplied table ARN |
| A set of resources | `grant iam role Read ARN_PATTERN` | The supplied pattern, such as `arn:aws:iam::123456789012:role/application/*` |

Use `explain cloudwatch Read,List` to inspect a service selection, including actions that require `Resource: "*"`. Because actions are enumerated, a service-wide document for a large service can exceed the IAM size limit for its destination. [IAM policy quotas](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html)

Use `services` to list service prefixes. Use `explain` to see matching actions, the resource's ARN template, condition keys, dependencies, other required resource types, and the AWS reference. To combine levels, pass `Read,List`. Quote `"Permissions management"` as a single argument.

## TypeScript

```ts
import { actionsForResource, Policy } from 'awspolicygenerator-ts'

const objectWrites = { service: 's3', resource: 'object', access: ['Write'] } as const

// Discover the whole access class without naming a bucket or listing individual actions.
const actions = actionsForResource(objectWrites)

// Each grant binds only its selected actions to its own ARN.
const policy = new Policy()
    .grant({ service: 'cloudwatch', access: ['Read', 'List'] })
    .grant({ service: 'sqs', resource: 'queue', access: ['Write'] })
    .grant({ ...objectWrites, arn: 'arn:aws:s3:::media-inbox/uploads/*' })
    .grant({ service: 's3', resource: 'object', access: ['Read'], arn: 'arn:aws:s3:::media-archive/*' })

console.log(policy.toJson())
```

Omitting `arn` from a resource grant uses the catalog's ARN template across the standard `aws` partition. For S3 objects this produces `arn:aws:s3:::*/*`. Account, region, and resource-name placeholders expand to wildcards where present. If another resource type supported by the selected actions shares the ARN shape, the generator asks for an explicit scope. An explicit ARN also lets you choose a different partition.

An ARN pattern can cover a whole resource type within an account. For example, `arn:aws:iam::123456789012:role/*` covers every IAM role in that account, including roles under paths. Resource selection checks the supplied pattern against the selected type's documented ARN shape. AWS evaluates the resulting wildcards. Use the narrowest pattern that expresses your intent.

`actionsForService('s3', ['List'])` returns action names across a service. `inspectService('s3', ['List'])` returns their conditions, required resource types, and dependencies. `describeAction('kms:CreateKey')` describes a single action. `inspectResource(selection).actions` returns per-action details for a particular resource type. A valid selection with zero matching actions returns an empty list for discovery and raises an error when building a grant.

## Dependencies, conditions, and explicit actions

An action can require permissions on additional resource types or from another service. For example, EC2 lists several required types for `ec2:RunInstances`, and its image relationship lists `iam:PassRole` as a possible dependency. Inspect `requiredResourceTypes` and `dependentActions` for the operation you intend to use. Supply any additional grants with their own scope. A single resource grant can be only one part of the authorization for an operation. [AWS Service Authorization Reference](https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html)

```ts
import { Policy, Statement } from 'awspolicygenerator-ts'

const upload = new Statement('Allow')
    .addActions(['s3:PutObject'])
    .onResources('arn:aws:s3:::media-inbox/uploads/*')
    .withConditions({ StringEquals: { 'aws:PrincipalTag/team': 'media' } })

const discoverBuckets = new Statement('Allow')
    .addActions(['s3:ListAllMyBuckets'])
    .onResources('*')

const policy = new Policy().addStatement(upload).addStatement(discoverBuckets)
```

`Statement.build()` returns an IAM statement. `Policy.build()` returns a versioned policy document. Both support `toJson()` and `toYaml()`. `Statement.toCdk()` returns a CDK `PolicyStatement`, and `Policy.toCdk()` returns a CDK `PolicyDocument`. Access levels and available conditions are descriptive. Only conditions supplied with operators and values appear in the policy.

`Statement.fromJson()` and `Statement.fromYaml()` read identity statements with explicit catalog actions, ARN strings or lists, `Effect`, optional `Sid`, and optional `Condition`. They also accept the prototype's lowercase field names. Unsupported fields, wildcard actions, and unknown actions raise errors. Explicit-action statements accept caller-supplied ARNs. The resource-type selector supplies the additional type check.

### Migrating the prototype selector

```ts
const roles = new Statement('Allow').addActionsForResource({
    service: 'iam', resource: 'role', privLevels: ['readPrivileges', 'listPrivileges'],
    resourceArn: 'arn:aws:iam::123456789012:role/application/*',
})
```

`addSpecificActions` remains an alias of `addActions`. Discovery through `getActions()` works before binding an ARN. Export uses a type-wide scope or the supplied ARN, uses IAM's `Effect`, `Action`, and `Resource` casing, and preserves explicit ARNs and condition values. Dependencies and other required resources are returned as metadata. Migrate uses of the old automatic resource expansion flag to separate grants. For multiple independent scopes, call `Policy.grant` once per scope.

## Catalog and refresh

The bundled snapshot contains **451 service prefixes, 21,376 actions, and 2,259 documented ARN templates**. It is compiled from a pinned Policy Sentry dump of AWS's Service Authorization Reference. The catalog stores each action and resource definition once per service. Each action-to-resource relationship keeps its own required flag, condition keys, and dependent actions. The empty resource key in the source carries action-wide metadata. [Pinned upstream definition](https://github.com/salesforce/policy_sentry/blob/2575f2b873e1c1f0fb604a448dee392f39ad74ad/policy_sentry/shared/data/iam-definition.json)

The source names three EventBridge types without defining their ARN formats: `event-busv2`, `publisher`, and `subscriber`. Discovery exposes the actions with a null `arnTemplate`. Typed policy generation reports the missing format.

To reproduce the snapshot, download the pinned file and compile it with Rust. Run these commands from the repository root:

```sh
curl -fL https://raw.githubusercontent.com/salesforce/policy_sentry/2575f2b873e1c1f0fb604a448dee392f39ad74ad/policy_sentry/shared/data/iam-definition.json -o iam-definition.json
npm run catalog -- iam-definition.json data/catalog.json
npm test
```

The pinned input's SHA-256 is `619e1a0bcf4991c241a94bab77f75ae151b668db0fe4431e9218fb6914a1e29b`. The compiler also accepts the original repository dump. To update, choose a new upstream commit, regenerate the catalog, and review the action changes before updating the pin and digest. A new action classified as Write can change a freshly generated policy. Existing exported policies keep their explicit action lists.

Run `cargo test --locked --manifest-path tools/catalog/Cargo.toml` for the importer tests. Policy generation and discovery use the checked-in catalog offline.
