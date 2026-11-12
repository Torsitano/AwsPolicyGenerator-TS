import { StringConcat, Token, Tokenization } from 'aws-cdk-lib'

// Match literal ARN fields against the upstream resource template. IAM resource names
// may contain paths (e.g. role/team/name) and some AWS templates use colon separators.
function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function arnFields(template: string): string[] {
    const parts = template.replace(/^\^/, '').split(':')
    return [...parts.slice(0, 5), parts.slice(5).join(':')]
}

// Only infer a type-wide scope when a literal field or prefix distinguishes it from
// every alternative type supported by the selected actions (e.g. instance/ vs volume/).
function distinctField(pattern: string, other: string): boolean {
    if (pattern === '') return /[^*]/.test(other)
    const left = pattern.split('*', 1)[0]!
    const right = other.split(/\*|\$\{/, 1)[0]!
    if (!pattern.includes('*') && right === other) return pattern !== other
    if (other === '') return left.length > 0
    return !left.startsWith(right) && !right.startsWith(left)
}

export function typeWideScope(template: string, alternatives: Iterable<string | null>): string {
    const arn = template.replace(/^\^/, '').replaceAll('${Partition}', 'aws').replace(/\$\{[^}]+\}/g, '*')
    validateArn(arn)
    const fields = arnFields(arn)
    for (const alternative of alternatives) {
        if (alternative !== null && arnFields(alternative).some((field, i) => distinctField(fields[i]!, field))) continue
        throw new Error('The type-wide ARN can overlap another supported resource type. Supply an explicit ARN or ARN pattern.')
    }
    return arn
}

// Validate the visible fields of a CDK ARN. A leading token can contain the entire
// ARN, including when bucket.arnForObjects() appends a path to bucket.bucketArn.
function arnForValidation(arn: string): string | undefined {
    if (typeof arn !== 'string') throw new Error('Expected a resource ARN string')
    if (!Token.isUnresolved(arn)) return arn
    const fragments = Tokenization.reverseString(arn)
    if (fragments.firstToken) return undefined
    // "aws" is a valid placeholder for an unresolved partition, service or name.
    return fragments.mapTokens({ mapToken: () => 'aws' }).join(new StringConcat())
}

function checkedArn(arn: string): string | undefined {
    const visible = arnForValidation(arn)
    if (visible !== undefined && !/^arn:aws(?:-[a-z0-9]+)*:[a-z0-9-]+:[^:\s]*:[^:\s]*:[^\s]+$/.test(visible)) {
        throw new Error(`Expected a full resource ARN, got ${arn}`)
    }
    return visible
}

export function validateArn(arn: string): void {
    checkedArn(arn)
}

export function checkScope(arn: string, template: string): void {
    const visible = checkedArn(arn)
    if (visible === undefined) return
    const fields = arnFields(template)
    const pattern = fields.map((field, index) =>
        field.split(/(\$\{[^}]+\}|\*)/).map(piece => {
            if (piece === '*') return index < 5 ? '[^:]*' : '.*'
            if (!piece.startsWith('${')) return escapeRegex(piece)
            if (index < 5) return '[^:]+'
            if (piece === '${BucketName}') return '[^/:]+'
            return '.+'
        }).join('')
    ).join(':')
    if (!new RegExp(`^${pattern}$`).test(visible)) {
        throw new Error(`Resource ARN ${arn} does not match ${template}`)
    }
}
