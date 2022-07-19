
export interface IamDefinition {
    [ key: string ]: {
        serviceName: string,
        prefix: string,
        serviceAuthorizationUrl: string,
        privileges: ImportPrivs,
        resources: ImportResources,
        conditions: ImportConditions
    }
}

export interface ImportPrivs {
    [ key: string ]: PrivilegeProperties
}

export interface ImportResources {
    [ key: string ]: ResourceProperties
}


export interface ServiceDefinition {
    serviceName: string,
    prefix: string,
    serviceAuthorizationUrl: string,
    privileges: ServicePrivilege
}

export interface ServicePrivilege {
    [ key: string ]: PrivilegeProperties
}

export interface PrivilegeProperties {
    privilege: string,
    description: string,
    accessLevel: AccessLevel,
    resourceTypes: ResourceType,
    apiDocumentationLink: string
}

export interface ResourceType {
    [ key: string ]: ResourceTypeProperties
}

export interface ResourceTypeProperties {
    resourceType: string,
    required: boolean,
    conditionKeys: string[],
    dependentActions: string[]
}

export interface ImportConditions {
    [ key: string ]: ConditionTypeProperties
}

export interface ConditionTypeProperties {
    condition: string,
    description: string,
    type: ConditionType
}

export enum AccessLevel {
    LIST = 'List',
    READ = 'Read',
    WRITE = 'Write',
    PERMISSIONS_MANAGEMENT = 'Permissions management',
    TAGGING = 'Tagging'
}



export interface ResourceProperties {
    resource: string,
    arn: string,
    conditionKeys: string[]
}

export enum ConditionType {
    STRING = 'String',
    ARN = 'ARN',
    NUMERIC = 'Numeric',
    DATE = 'Date',
    BOOLEAN = 'Boolean',
    IP_ADDRESS = 'IpAddress',
    NULL = 'Null',
    IF_EXISTS = 'IfExists'
}



// ######################
// RESOURCE NORMALIZATION
// ######################



export interface ResourceBase {
    resourceName: string,
    resourceArn: string,
    resourceConditions: ImportConditions,
}


export interface NormalizedResource extends ResourceBase {
    listPrivileges: Privileges,
    readPrivileges: Privileges,
    writePrivileges: Privileges,
    tagPrivileges: Privileges,
    permManPrivileges: Privileges,
    service: string
}

export interface NormalizedResources {
    [ key: string ]: NormalizedResource
}

export interface PrivilegeBase {
    privilege: string,
    description: string,
    privConditions: ImportConditions,
    dependentActions: string[],
    accessLevel: AccessLevel,
    apiDocumentationLink: string
}

export interface Privileges {
    [ key: string ]: PrivilegeBase
}

export interface PrivMap extends PrivilegeBase {
    required: boolean
}

export interface NormalizedPrivilege extends PrivilegeBase {
    resources: {
        [ key: string ]: ( ResourceBase & {
            required: boolean
        } )
    },
    service: string
}

export interface NormalizedPrivileges {
    [ key: string ]: NormalizedPrivilege
}

export interface NormalizedService {

    service: string,
    listPrivileges: string[],
    readPrivileges: string[],
    writePrivileges: string[],
    tagPrivileges: string[],
    permManPrivileges: string[],
    privsWithoutResource: string[],
    resources: string[]

}

export interface NormalizedDefinition {
    privileges: {
        [ key: string ]: NormalizedPrivileges
    },
    resources: {
        [ key: string ]: NormalizedResources
    },
    services: {
        [ key: string ]: NormalizedService
    },
    conditions: ImportConditions
}



/////////////////////////////////////////////
//////////////////////////////////////////////

// export interface Base {
//     toYaml(): string,
//     toJson(): string,
//     permissionLevels(): string[],
//     services(): string[]
// }


export interface PolicyStatement {
    effect: 'Allow' | 'Deny',
    action: string[],
    principal?: string[],
    condition?: {
        [ key: string ]: {
            [ key: string ]: string
        }
    },
    resource: string[]
}

export interface GeneratedStatement {
    statement: PolicyStatement,

}

export interface Policy {
    version: string,
    statement: PolicyStatement[]
}

export interface PolicyObject {
    policy: Policy,
    toYaml(): string,
    toJson(): string,
    permissionLevels(): string[],
    services(): string[]
}



// ########################################
// Argument Interfaces
// ########################################
export type PrivilegeLevel = 'listPrivileges' | 'readPrivileges' | 'writePrivileges' | 'permManPrivileges' | 'tagPrivileges'


export interface AddActionsForResourceTypeParams {
    /** The AWS Service you want to add actions for */
    service: string,
    /** The resource you want to add permissions for */
    resource: string,
    /** The privilege levels to include. Options: 'listPrivileges' | 'readPrivileges' | 'writePrivileges' | 'permManPrivileges' | 'tagPrivileges'  */
    privLevels: PrivilegeLevel[]
}

export interface AddActionsForResourceParams extends AddActionsForResourceTypeParams {
    /** The full ARN for the specific resource */
    resourceArn?: string
}

export interface AddActionsForServiceParams {
    /** The AWS Service you want to add actions for */
    service: string,
    /** The privilege levels to include. Options: 'listPrivileges' | 'readPrivileges' | 'writePrivileges' | 'permManPrivileges' | 'tagPrivileges'  */
    privilegeLevels: PrivilegeLevel[]
}

