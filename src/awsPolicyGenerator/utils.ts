//import { PolicyStatement } from './interfaces/interfaces'

export function camelPrivName( privilege: string ): string {
    const camelName = privilege.charAt( 0 ).toLowerCase() + privilege.substring( 1 )
    return camelName
}

// export function globCheck( policyStatement: PolicyStatement ): PolicyStatement {




// }