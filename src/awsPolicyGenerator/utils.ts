
export function pascalPrivName( privilege: string ): string {
    const pascalName = privilege.charAt( 0 ).toLowerCase() + privilege.substring( 1 )
    return pascalName
}
