import { Action } from '../src/awsPolicyGenerator/statementComponents/Action'
import * as fs from 'fs'
import { NormalizedDefinition } from '../src/awsPolicyGenerator/interfaces/interfaces'

const iamDefinition: NormalizedDefinition = JSON.parse( fs.readFileSync( `./lib/normalizedDefinition.json`, 'utf-8' ) )

const action = new Action( iamDefinition.privileges[ 'kms' ][ 'createKey' ] )

console.dir( action, { depth: null } )