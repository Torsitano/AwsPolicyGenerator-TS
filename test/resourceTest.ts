import { Resource } from './../src/awsPolicyGenerator/statementComponents/Resource'
import * as fs from 'fs'
import { NormalizedDefinition } from '../src/awsPolicyGenerator/interfaces/interfaces'

const iamDefinition: NormalizedDefinition = JSON.parse( fs.readFileSync( `./lib/normalizedDefinition.json`, 'utf-8' ) )

const service = 'kms'
const resourceName = 'key'

const resource = new Resource( iamDefinition.resources[ service ][ resourceName ] )

console.dir( resource, { depth: null } )