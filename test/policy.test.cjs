const test = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { parse } = require('yaml')
const { Policy, Statement, actionsForResource, actionsForService, inspectResource, describeAction, listServices, listResources } = require('..')

const objects = { service: 's3', resource: 'object', access: ['Write'] }
const inbox = 'arn:aws:s3:::example-inbox/uploads/*'
const archive = 'arn:aws:s3:::example-archive/*'

test('resource selection follows catalog classifications, including deletion and excluding tagging', () => {
    const actions = actionsForResource(objects)
    assert.ok(actions.includes('s3:PutObject'))
    assert.ok(actions.includes('s3:DeleteObject'))
    for (const action of ['s3:GetObject', 's3:ListBucket', 's3:PutObjectTagging', 's3:PutObjectAcl']) {
        assert.ok(!actions.includes(action), action)
    }
    assert.deepEqual(actions, [...new Set(actions)].sort())
    assert.deepEqual(actionsForResource({ ...objects, access: ['Write', 'Write'] }), actions)
    assert.ok(actionsForResource({ ...objects, access: ['Tagging'] }).includes('s3:PutObjectTagging'))
    assert.ok(actionsForResource({ ...objects, access: ['Permissions management'] }).includes('s3:PutObjectAcl'))
})

test('separate grants retain their action and ARN pairings', () => {
    const policy = new Policy()
        .grant({ ...objects, arn: inbox })
        .grant({ ...objects, access: ['Read'], arn: archive })
        .grant({ ...objects, arn: archive }, 'Deny')
    const built = policy.build()
    assert.equal(built.Version, '2012-10-17')
    const [write, read, deny] = built.Statement
    assert.deepEqual(write, { Effect: 'Allow', Action: actionsForResource(objects), Resource: [inbox] })
    assert.deepEqual(read.Resource, [archive])
    assert.ok(read.Action.includes('s3:GetObject'))
    assert.ok(!read.Action.includes('s3:PutObject'))
    assert.deepEqual(deny, { ...write, Effect: 'Deny', Resource: [archive] })
    assert.deepEqual(parse(policy.toYaml()), JSON.parse(policy.toJson()))
})

test('per-resource conditions and dependencies are preserved on the correct relationship', () => {
    const selection = resource => inspectResource({ service: 'ec2', resource, access: ['Write'] }).actions.find(a => a.action === 'ec2:RunInstances')
    const instance = selection('instance')
    const image = selection('image')
    assert.ok(image.dependentActions.includes('iam:PassRole'))
    assert.ok(!instance.dependentActions.includes('iam:PassRole'))
    assert.ok(image.conditionKeys.includes('ec2:Owner'))
    assert.ok(!instance.conditionKeys.includes('ec2:Owner'))
    assert.ok(instance.requiredResourceTypes.includes('image'))
    assert.ok(instance.requiredResourceTypes.includes('instance'))
})

test('resource-agnostic actions require explicit wildcard scope and builds never add dependencies', () => {
    const s = new Statement().addSpecificActions(['kms:CreateKey']).onResources('*')
    const before = s.getDependentActions()
    assert.ok(before.includes('kms:PutKeyPolicy'))
    assert.deepEqual(s.build().Action, ['kms:CreateKey'])
    assert.deepEqual(s.build(), s.build())
    assert.deepEqual(before, s.getDependentActions())
    s.onResources('arn:aws:kms:us-east-1:123456789012:key/example')
    assert.throws(() => s.build(), /requires Resource/)
    assert.deepEqual(describeAction('kms:CreateKey').supportedResourceTypes, [])
    assert.ok(!actionsForResource({ service: 'kms', resource: 'key', access: ['Write'] }).includes('kms:CreateKey'))
})

test('parsing preserves scope, effect, Sid and conditions through JSON, YAML and CDK', () => {
    const input = {
        sid: 'AuditScope', effect: 'Deny', action: 's3:GetObject', resource: archive,
        condition: { StringNotEquals: { 'aws:PrincipalTag/team': ['media', 'infra'] } },
    }
    const built = {
        Sid: input.sid, Effect: input.effect, Action: [input.action], Resource: [archive], Condition: input.condition,
    }
    const statement = Statement.fromJson(JSON.stringify(input))
    assert.deepEqual(statement.build(), built)
    assert.deepEqual(Statement.fromYaml(statement.toYaml()).build(), built)
    const cdk = statement.toCdk().toStatementJson()
    assert.deepEqual(Statement.buildFrom(cdk).build(), built)
    statement.build().Condition.StringNotEquals['aws:PrincipalTag/team'].push('unexpected')
    assert.deepEqual(statement.build(), built)
})

test('the README selector supports late binding, and failed mutations preserve the existing grant', () => {
    const s = new Statement('Allow').addActionsForResource({ service: 's3', resource: 'object', privLevels: ['writePrivileges'] })
    assert.deepEqual(s.getActions(), actionsForResource(objects))
    assert.deepEqual(s.build().Resource, ['arn:aws:s3:::*/*'])
    assert.deepEqual(new Policy().grant(objects).build().Statement[0], s.build())
    const tables = { service: 'dynamodb', resource: 'table', access: ['Write'] }
    assert.throws(() => new Policy().grant(tables).build(), /overlap/)
    assert.deepEqual(new Policy().grant({ ...tables, arn: 'arn:aws:dynamodb:us-east-1:123456789012:table/orders' }).build().Statement[0].Resource,
        ['arn:aws:dynamodb:us-east-1:123456789012:table/orders'])
    s.onResources(inbox)
    const before = s.build()
    assert.throws(() => s.addActions(['s3:GetObject', 's3:ListBucket']), /does not support/)
    assert.deepEqual(s.build(), before)
    assert.throws(() => s.selectResource(objects, archive), /separate resource scope/)
    assert.throws(() => s.onResources('*'), /full resource ARN/)
    assert.deepEqual(s.build(), before)
})

test('discovery preserves IAM service prefixes, categories and ARN shapes', () => {
    assert.ok(listServices().includes('execute-api'))
    assert.ok(actionsForService('s3', ['List']).includes('s3:ListAllMyBuckets'))
    const unresolved = { service: 'events', resource: 'event-busv2', access: ['Write'] }
    assert.equal(inspectResource(unresolved).arnTemplate, null)
    assert.ok(actionsForResource(unresolved).includes('events:PutEvents'))
    assert.throws(() => Statement.forResource({ ...unresolved, arn: inbox }), /no ARN format/)
    assert.ok(listResources('execute-api').includes('execute-api-general'))
    assert.ok(describeAction('execute-api:Invoke').supportedResourceTypes.includes('execute-api-general'))
    assert.ok(actionsForResource({ service: 'iam', resource: 'role', access: ['Read', 'List'] }).includes('iam:GetRole'))
    const agreement = { service: 'artifact', resource: 'agreement', access: ['Read'], arn: 'arn:aws:artifact:::agreement/example' }
    assert.deepEqual(Statement.forResource(agreement).build().Resource, [agreement.arn])
    const role = 'arn:aws-us-gov:iam::123456789012:role/application/uploader'
    assert.deepEqual(Statement.forResource({ service: 'iam', resource: 'role', access: ['Read'], arn: role }).build().Resource, [role])
})

test('invalid and unsupported inputs fail without broadening a policy', () => {
    for (const fields of [{ service: 'unknown' }, { resource: 'toString' }, { access: [] }, { access: ['Admin'] }]) {
        assert.throws(() => actionsForResource({ ...objects, ...fields }))
    }
    assert.throws(() => Statement.forResource({ ...objects, arn: 'arn:aws:s3:::example-inbox' }), /does not match/)
    assert.throws(() => Statement.forResource({ ...objects, resource: 'bucket', arn: inbox }), /does not match/)
    assert.throws(() => Statement.forResource({ ...objects, arn: 'arn:aws:iam::123456789012:role/test' }), /does not match/)
    const raw = { Effect: 'Allow', Action: 's3:GetObject', Resource: inbox }
    for (const fields of [{ NotAction: 's3:PutObject' }, { effect: 'Deny' }, { Condition: { StringEquals: {} } }, { Action: 's3:Get*' }, { Resource: [] }]) {
        assert.throws(() => Statement.buildFrom({ ...raw, ...fields }))
    }
    assert.throws(() => new Policy().build(), /at least one statement/)
})

test('CLI builds a policy from outside the repository and sends errors to stderr', () => {
    const cli = (...args) => spawnSync(process.execPath, [join(__dirname, '../dist/cli.js'), ...args], { cwd: tmpdir(), encoding: 'utf8' })
    const result = cli('grant', 's3', 'object', 'Write', inbox)
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout), new Policy().grant({ ...objects, arn: inbox }).build())
    const error = cli('grant', 's3', 'object', 'Wrong', inbox)
    assert.notEqual(error.status, 0)
    assert.equal(error.stdout, '')
    assert.match(error.stderr, /Unknown access level/)
})
