import * as fs from 'fs'



const iamDefinition = JSON.parse( fs.readFileSync( `./lib/normalizedDefinition.json`, 'utf-8' ) )

const serviceDefinition = iamDefinition.privileges[ 'iam' ]
console.log( Object.keys( serviceDefinition ) )