#!/usr/bin/env node
import { Access, inspectResource, listResources, listServices, Policy } from './index'

const usage = [
    'iam-policy services',
    'iam-policy resources SERVICE',
    'iam-policy explain SERVICE RESOURCE LEVEL[,LEVEL...]',
    'iam-policy grant SERVICE RESOURCE LEVEL[,LEVEL...] [ARN]',
    'Levels: List, Read, Write, Tagging, "Permissions management"',
].join('\n')

function run(args: string[]): unknown {
    const [command, service, resource, levels, arn] = args
    if (command === 'services' && args.length === 1) return listServices()
    if (command === 'resources' && args.length === 2 && service) return listResources(service)
    if (service && resource && levels) {
        const selection = { service, resource, access: levels.split(',').map(s => s.trim()) as Access[] }
        if (command === 'explain' && args.length === 4) return inspectResource(selection)
        if (command === 'grant' && (args.length === 4 || args.length === 5)) return new Policy().grant({ ...selection, arn }).build()
    }
    throw new Error(usage)
}

try {
    const args = process.argv.slice(2)
    if (args.length === 1 && ['--help', '-h'].includes(args[0]!)) console.log(usage)
    else console.log(JSON.stringify(run(args), null, 2))
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
}
