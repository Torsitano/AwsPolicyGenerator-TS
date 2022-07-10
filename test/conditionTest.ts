import { Condition } from './../src/awsPolicyGenerator/statementComponents/Condition'
import * as fs from 'fs'
import { ImportConditions } from '../src/awsPolicyGenerator/interfaces/interfaces'

const iamDefinition: ImportConditions = JSON.parse( fs.readFileSync( `lib/serviceDefinitions/kms/kmsConditions.json`, 'utf-8' ) )




const condition = new Condition( iamDefinition[ 'kms:CallerAccount' ] )

console.dir( condition, { depth: null } )