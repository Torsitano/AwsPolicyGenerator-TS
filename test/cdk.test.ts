import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { App, ArnFormat, Stack, Token } from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Policy, Statement } from '..'

test('a TypeScript grant chain attaches to a role and synthesizes construct ARNs', t => {
    const outdir = mkdtempSync(join(tmpdir(), 'iam-cdk-test-'))
    t.after(() => rmSync(outdir, { recursive: true, force: true }))
    const app = new App({ outdir })
    const stack = new Stack(app, 'Application')
    const orders = new dynamodb.Table(stack, 'Orders', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    })
    const inbox = new s3.Bucket(stack, 'Inbox')
    const role = new iam.Role(stack, 'Worker', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })
    const uploads = inbox.arnForObjects('uploads/*')
    assert.ok(Token.isUnresolved(orders.tableArn))
    assert.ok(Token.isUnresolved(uploads))
    const permissions = new Policy()
        .grant({ service: 'dynamodb', resource: 'table', access: ['Read'], arn: orders.tableArn })
        .grant({ service: 's3', resource: 'object', access: ['Write'], arn: uploads })
        .grant({ service: 'sqs', resource: 'queue', access: ['Write'] })
        .grant({ service: 'cloudwatch', access: ['Read', 'List'] })
    const document: iam.PolicyDocument = permissions.toCdk()
    new iam.Policy(stack, 'WorkerAccess', { document, roles: [role] })

    const resources = app.synth().getStackArtifact(stack.artifactId).template.Resources
    const findId = (type: string) => {
        const id = Object.keys(resources).find(key => resources[key].Type === type)
        assert.ok(id, `Missing ${type}`)
        return id
    }
    const policy = resources[findId('AWS::IAM::Policy')].Properties
    assert.deepEqual(policy.Roles, [{ Ref: findId('AWS::IAM::Role') }])
    const expected = permissions.build().Statement
    assert.equal(policy.PolicyDocument.Statement.length, expected.length)
    for (const [index, statement] of expected.entries()) {
        const actual = policy.PolicyDocument.Statement[index]
        assert.deepEqual(actual.Action, statement.Action)
        assert.equal(actual.Effect, statement.Effect)
    }
    const [table, objects, queues, metrics] = policy.PolicyDocument.Statement
    assert.deepEqual(table.Resource, { 'Fn::GetAtt': [findId('AWS::DynamoDB::Table'), 'Arn'] })
    assert.deepEqual(objects.Resource, { 'Fn::Join': ['', [
        { 'Fn::GetAtt': [findId('AWS::S3::Bucket'), 'Arn'] }, '/uploads/*',
    ]] })
    assert.equal(queues.Resource, 'arn:aws:sqs:*:*:*')
    assert.equal(metrics.Resource, '*')
    assert.doesNotMatch(JSON.stringify(policy), /\$\{Token\[/)

    const explicit = new Statement().addActions(['s3:PutObject']).onResources(uploads).toCdk()
    assert.deepEqual(stack.resolve(explicit.toStatementJson()).Resource, objects.Resource)
})

test('a partly tokenized ARN still checks its visible service and resource type', () => {
    const stack = new Stack(undefined, 'Validation')
    const selection = { service: 'iam', resource: 'role', access: ['Read'] } as const
    const arn = (service: string, resource: string) => stack.formatArn({
        service, resource, resourceName: 'worker', arnFormat: ArnFormat.SLASH_RESOURCE_NAME, region: '',
    })
    const roleArn = arn('iam', 'role')
    assert.ok(Token.isUnresolved(roleArn))
    assert.deepEqual(new Policy().grant({ ...selection, arn: roleArn }).build().Statement[0]?.Resource, [roleArn])
    for (const wrong of [arn('iam', 'user'), arn('sqs', 'role'), 'invalid' + stack.account]) {
        assert.throws(() => new Policy().grant({ ...selection, arn: wrong }), /does not match|full resource ARN/)
    }
    assert.throws(() => new Policy().toCdk(), /at least one statement/)
})
