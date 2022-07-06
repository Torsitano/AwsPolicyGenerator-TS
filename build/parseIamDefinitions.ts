import { IamDefinition } from '../src/awsPolicyGenerator/interfaces/interfaces'
import * as fs from 'fs'
import { camelizeKeys } from 'humps'

const defRoot = './lib/serviceDefinitions/'

const iamDefinition: object = JSON.parse( fs.readFileSync( './lib/iamDefinition.json', 'utf-8' ) )
const iamDefHumps = camelizeKeys( iamDefinition ) as IamDefinition

fs.writeFileSync( 'lib/iamDefinitionHumps.json', JSON.stringify( iamDefHumps, null, 4 ), 'utf-8' )


for ( let service in iamDefHumps ) {

    const serviceDef = iamDefHumps[ service ]

    let folderPath = defRoot + service + '/'

    if ( !fs.existsSync( folderPath ) ) {
        fs.mkdirSync( folderPath, { recursive: true } )
    }

    fs.writeFileSync( `${folderPath}${service}Privileges.json`, JSON.stringify( serviceDef.privileges, null, 4 ), 'utf-8' )
    fs.writeFileSync( `${folderPath}${service}Resources.json`, JSON.stringify( serviceDef.resources, null, 4 ), 'utf-8' )
    fs.writeFileSync( `${folderPath}${service}Conditions.json`, JSON.stringify( serviceDef.conditions, null, 4 ), 'utf-8' )

}