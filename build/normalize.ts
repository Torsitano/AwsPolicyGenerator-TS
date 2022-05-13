import { PrivilegeProperties, AccessLevel, NormalizedResource, PrivMap, ConditionProperties,
    NormalizedPrivilege, ResourceBase, ResourceProperties, NormalizedPrivileges, NormalizedResources } from '../src/awsPolicyGenerator/interfaces/interfaces';
import * as fs from 'fs'


const serviceDefDir = './lib/serviceDefinitions'

interface ImportPrivs {
    [key: string]: PrivilegeProperties
}

interface ImportResources {
    [key: string]: ResourceProperties
}



function mapPrivsToResources(privileges: ImportPrivs, serviceConditions: ConditionProperties) {

    let resourceActionMap: Map<string, PrivMap[]> = new Map
    for( let privKey in privileges ) {
        let priv = privileges[privKey]

        let conKeys: string[] = []

        // Conditions are present on an empty string key
        if(priv.resourceTypes['']) {
            conKeys = priv.resourceTypes[''].conditionKeys
        }

        let conditions: ConditionProperties = {}

        for (let key of conKeys) {
            conditions[key] = serviceConditions[key]
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
        
        for (let resourceType in priv.resourceTypes) {
            if(resourceType != '') {
                privMap.dependentActions = priv.resourceTypes[resourceType].dependentActions
                privMap.required = priv.resourceTypes[resourceType].required
                
                if(resourceActionMap.has(resourceType)) {
                    let value = resourceActionMap.get(resourceType)
                    if (value) {
                        
                        value.push(privMap)
                    
                        resourceActionMap.set(resourceType, value)
                    }
                    
                } else {
                    resourceActionMap.set(resourceType, [privMap])
                }
            }
        }
    }

    return resourceActionMap
}


function normalizeResources(service: string, privileges: ImportPrivs, resources: ImportResources, serviceConditions: ConditionProperties) {

    let normalizedResources: NormalizedResources = {}

    let resourceActionMap = mapPrivsToResources(privileges, serviceConditions)

    for (let resourceKey in resources) {

        let resource = resources[resourceKey]
        let resourceActions = resourceActionMap.get(resourceKey)
        let conditions: ConditionProperties = {}

    for (let key of resource.conditionKeys) {
        conditions[key] = serviceConditions[key]
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

        if (resourceActions)
        for (let action of resourceActions) {
            switch(action.accessLevel) {
                case AccessLevel.LIST: {
                    normalizedResource.listPrivileges[action.privilege] = action
                    break
                }
                case AccessLevel.READ: {
                    normalizedResource.readPrivileges[action.privilege] = action
                    break
                }
                case AccessLevel.WRITE: {
                    normalizedResource.writePrivileges[action.privilege] = action
                    break
                }
                case AccessLevel.PERMISSIONS_MANAGEMENT: {
                    normalizedResource.permManPrivileges[action.privilege] = action
                    break
                }
                case AccessLevel.TAGGING: {
                    normalizedResource.tagPrivileges[action.privilege] = action
                    break
                }
            }
        } 
        normalizedResources[resourceKey] = normalizedResource
    }

    let folderPath = `${serviceDefDir}/${service}/`  
    fs.writeFileSync(`${folderPath}${service}NormalizedResources.json`, JSON.stringify(normalizedResources, null, 4), 'utf-8')

}

export function normalizePrivs(service: string, privileges: ImportPrivs, resources: ImportResources, serviceConditions: ConditionProperties) {
    
    let normalizedPrivileges: NormalizedPrivileges = {}

    for (let privKey in privileges) {

        let priv = privileges[privKey]

        let conKeys: string[] = []

        // Conditions are present on an empty string key
        if(priv.resourceTypes['']) {
            conKeys = priv.resourceTypes[''].conditionKeys
        }

        let conditions: ConditionProperties = {}

        for (let key of conKeys) {
            conditions[key] = serviceConditions[key]
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

        for (let resourceKey in priv.resourceTypes) {
            if(resourceKey != '') {
                let resource = resources[resourceKey]

                let conditions: ConditionProperties = {}
    
                for (let key of resource.conditionKeys) {
                    conditions[key] = serviceConditions[key]
                }
    
                let privResource: (ResourceBase & {required: boolean}) = {
                    resourceName: resource.resource,
                    resourceArn: resource.arn,
                    required: priv.resourceTypes[resourceKey].required,
                    resourceConditions: conditions
                }
                normalPriv.dependentActions = normalPriv.dependentActions.concat(priv.resourceTypes[resourceKey].dependentActions)
    
                normalPriv.resources[resourceKey] = privResource
            }
            
        }

        normalizedPrivileges[privKey] = normalPriv
    }

    let folderPath = `${serviceDefDir}/${service}/`
    fs.writeFileSync(`${folderPath}${service}NormalizedPrivileges.json`, JSON.stringify(normalizedPrivileges, null, 4), 'utf-8')

}


export function main() {
    const directories = fs.readdirSync(serviceDefDir)
    
    for (let service of directories) {
        const privileges: ImportPrivs = JSON.parse(fs.readFileSync(
            `${serviceDefDir}/${service}/${service}Privileges.json`, 'utf-8'
        ))
        const resources: ImportResources = JSON.parse(fs.readFileSync(
            `${serviceDefDir}/${service}/${service}Resources.json`, 'utf-8'
        ))
        const serviceConditions: ConditionProperties = JSON.parse(fs.readFileSync(
            `${serviceDefDir}/${service}/${service}Conditions.json`, 'utf-8'
        ))

        normalizeResources(service, privileges, resources, serviceConditions)
        normalizePrivs(service, privileges, resources, serviceConditions)
    }
}

main()