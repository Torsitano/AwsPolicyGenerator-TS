import {
    AccessLevel, NormalizedResource, PrivMap, ImportConditions,
    NormalizedPrivilege, ResourceBase, NormalizedPrivileges, NormalizedResources,
    ImportPrivs, ImportResources, NormalizedDefinition, NormalizedService
} from '../src/awsPolicyGenerator/interfaces/interfaces'
import * as fs from 'fs'


const serviceDefDir = './lib/serviceDefinitions'


function mapPrivsToResources( privileges: ImportPrivs, serviceConditions: ImportConditions ) {

    let resourceActionMap: Map<string, PrivMap[]> = new Map
    for ( let privKey in privileges ) {
        const priv = privileges[ privKey ]

        let conKeys: string[] = []

        // Conditions are present on an empty string key
        if ( priv.resourceTypes[ '' ] ) {
            conKeys = priv.resourceTypes[ '' ].conditionKeys
        }

        let conditions: ImportConditions = {}

        for ( let key of conKeys ) {
            conditions[ key ] = serviceConditions[ key ]
        }

        let privMap: PrivMap = {
            privilege: priv.privilege,
            description: priv.description,
            accessLevel: priv.accessLevel,
            apiDocumentationLink: priv.apiDocumentationLink,
            privConditions: conditions,
            dependentActions: [],
            required: false
        }

        for ( let resourceType in priv.resourceTypes ) {
            if ( resourceType != '' ) {
                privMap.dependentActions = priv.resourceTypes[ resourceType ].dependentActions
                privMap.required = priv.resourceTypes[ resourceType ].required

                if ( resourceActionMap.has( resourceType ) ) {
                    let value = resourceActionMap.get( resourceType )
                    if ( value ) {

                        value.push( privMap )

                        resourceActionMap.set( resourceType, value )
                    }

                } else {
                    resourceActionMap.set( resourceType, [ privMap ] )
                }
            }
        }
    }

    return resourceActionMap
}


function normalizeResources( service: string, privileges: ImportPrivs, resources: ImportResources, serviceConditions: ImportConditions ) {

    let normalizedResources: NormalizedResources = {}

    let resourceActionMap = mapPrivsToResources( privileges, serviceConditions )

    for ( let resourceKey in resources ) {

        let resource = resources[ resourceKey ]
        let resourceActions = resourceActionMap.get( resourceKey )
        let conditions: ImportConditions = {}

        for ( let key of resource.conditionKeys ) {
            conditions[ key ] = serviceConditions[ key ]
        }

        let normalizedResource: NormalizedResource = {
            resourceName: resource.resource,
            service: service,
            resourceArn: resource.arn,
            resourceConditions: conditions,
            listPrivileges: {},
            readPrivileges: {},
            writePrivileges: {},
            permManPrivileges: {},
            tagPrivileges: {}
        }

        if ( resourceActions )
            for ( let action of resourceActions ) {
                switch ( action.accessLevel ) {
                    case AccessLevel.LIST: {
                        normalizedResource.listPrivileges[ action.privilege ] = action
                        break
                    }
                    case AccessLevel.READ: {
                        normalizedResource.readPrivileges[ action.privilege ] = action
                        break
                    }
                    case AccessLevel.WRITE: {
                        normalizedResource.writePrivileges[ action.privilege ] = action
                        break
                    }
                    case AccessLevel.PERMISSIONS_MANAGEMENT: {
                        normalizedResource.permManPrivileges[ action.privilege ] = action
                        break
                    }
                    case AccessLevel.TAGGING: {
                        normalizedResource.tagPrivileges[ action.privilege ] = action
                        break
                    }
                }
            }
        normalizedResources[ resourceKey ] = normalizedResource
    }

    let folderPath = `${serviceDefDir}/${service}/`
    fs.writeFileSync( `${folderPath}${service}NormalizedResources.json`, JSON.stringify( normalizedResources, null, 4 ), 'utf-8' )
    return normalizedResources
}

export function normalizePrivs( service: string, privileges: ImportPrivs, resources: ImportResources, serviceConditions: ImportConditions ) {

    let normalizedPrivileges: NormalizedPrivileges = {}

    for ( let privKey in privileges ) {

        let priv = privileges[ privKey ]

        let conKeys: string[] = []

        // Conditions are present on an empty string key
        if ( priv.resourceTypes[ '' ] ) {
            conKeys = priv.resourceTypes[ '' ].conditionKeys
        }

        let conditions: ImportConditions = {}

        for ( let key of conKeys ) {
            conditions[ key ] = serviceConditions[ key ]
        }

        let normalPriv: NormalizedPrivilege = {
            privilege: priv.privilege,
            description: priv.description,
            accessLevel: priv.accessLevel,
            apiDocumentationLink: priv.apiDocumentationLink,
            service: service,
            dependentActions: [],
            privConditions: conditions,
            resources: {}
        }

        for ( let resourceKey in priv.resourceTypes ) {
            normalPriv.dependentActions = normalPriv.dependentActions.concat( priv.resourceTypes[ resourceKey ].dependentActions )
            if ( resourceKey != '' ) {
                let resource = resources[ resourceKey ]

                let conditions: ImportConditions = {}

                for ( let key of resource.conditionKeys ) {
                    conditions[ key ] = serviceConditions[ key ]
                }

                let privResource: ( ResourceBase & { required: boolean } ) = {
                    resourceName: resource.resource,
                    resourceArn: resource.arn,
                    required: priv.resourceTypes[ resourceKey ].required,
                    resourceConditions: conditions
                }


                normalPriv.resources[ resourceKey ] = privResource
            }

        }

        normalizedPrivileges[ privKey ] = normalPriv
    }

    let folderPath = `${serviceDefDir}/${service}/`
    fs.writeFileSync( `${folderPath}${service}NormalizedPrivileges.json`, JSON.stringify( normalizedPrivileges, null, 4 ), 'utf-8' )
    return normalizedPrivileges
}

function normalizeService( service: string, privileges: ImportPrivs, resources: ImportResources ): NormalizedService {
    let normalizedService: NormalizedService = {
        listPrivileges: [],
        readPrivileges: [],
        permManPrivileges: [],
        tagPrivileges: [],
        privsWithoutResource: [],
        resources: [],
        service: service,
        writePrivileges: []
    }

    for ( let privKey in privileges ) {
        let priv = privileges[ privKey ]
        switch ( priv.accessLevel ) {
            case AccessLevel.LIST: {
                normalizedService.listPrivileges.push( priv.privilege )
                break
            }
            case AccessLevel.READ: {
                normalizedService.readPrivileges.push( priv.privilege )
                break
            }
            case AccessLevel.WRITE: {
                normalizedService.writePrivileges.push( priv.privilege )
                break
            }
            case AccessLevel.PERMISSIONS_MANAGEMENT: {
                normalizedService.permManPrivileges.push( priv.privilege )
                break
            }
            case AccessLevel.TAGGING: {
                normalizedService.tagPrivileges.push( priv.privilege )
                break
            }
        }

        /**
         * If there is only one resource listed and it's an empty string, that means it holds conditions for
         * the action and that the action isn't tied to specific resources. In that situation, or where there 
         * are no resource keys, the action will be added to the list
         */
        let numKeys = Object.keys( priv.resourceTypes ).length

        if ( numKeys === 0 || ( numKeys === 1 && priv.resourceTypes[ '' ] ) ) {
            normalizedService.privsWithoutResource.push( priv.privilege )
        }

    }

    for ( let resourceKey in resources ) {
        normalizedService.resources.push( resourceKey )
    }

    return normalizedService

}


export function main() {
    const directories = fs.readdirSync( serviceDefDir )

    const normalizedDefinition: NormalizedDefinition = {
        privileges: {},
        resources: {},
        services: {},
        conditions: {}
    }

    for ( let service of directories ) {
        const privileges: ImportPrivs = JSON.parse( fs.readFileSync(
            `${serviceDefDir}/${service}/${service}Privileges.json`, 'utf-8'
        ) )
        const resources: ImportResources = JSON.parse( fs.readFileSync(
            `${serviceDefDir}/${service}/${service}Resources.json`, 'utf-8'
        ) )
        const serviceConditions: ImportConditions = JSON.parse( fs.readFileSync(
            `${serviceDefDir}/${service}/${service}Conditions.json`, 'utf-8'
        ) )

        const normalizedResources = normalizeResources( service, privileges, resources, serviceConditions )
        const normalizedPrivs = normalizePrivs( service, privileges, resources, serviceConditions )
        const normalizedService = normalizeService( service, privileges, resources )

        normalizedDefinition.privileges[ service ] = normalizedPrivs
        normalizedDefinition.resources[ service ] = normalizedResources
        normalizedDefinition.services[ service ] = normalizedService
        normalizedDefinition.conditions = { ...normalizedDefinition.conditions, ...serviceConditions }
    }
    fs.writeFileSync( `./lib/normalizedDefinition.json`, JSON.stringify( normalizedDefinition, null, 4 ), 'utf-8' )

}

main()