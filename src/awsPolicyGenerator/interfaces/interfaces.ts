
export interface IamDefinition {
    [key: string]: {
        serviceName: string,
        prefix: string,
        serviceAuthorizationUrl: string,
        privileges: ImportPrivs,
        resources: ImportResources,
        conditions: ImportConditions
    }
}

export interface ImportPrivs {
    [key: string]: PrivilegeProperties
}

export interface ImportResources {
    [key: string]: ResourceProperties
}


export interface ServiceDefinition {
    serviceName: string,
    prefix: string,
    serviceAuthorizationUrl: string,
    privileges: ServicePrivilege
}

export interface ServicePrivilege {
    [key: string]: PrivilegeProperties
}

export interface PrivilegeProperties {
    privilege: string,
    description: string,
    accessLevel: AccessLevel,
    resourceTypes: ResourceType,
    apiDocumentationLink: string
}

export interface ResourceType {
    [key: string]: ResourceTypeProperties
}

export interface ResourceTypeProperties {
    resourceType: string,
    required: boolean,
    conditionKeys: string[],
    dependentActions: string[]
}

export interface ImportConditions {
    [key: string]: ConditionTypeProperties
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
    listPrivileges: {
        [key: string]: PrivilegeBase
    },
    readPrivileges: {
        [key: string]: PrivilegeBase
    },
    writePrivileges: {
        [key: string]: PrivilegeBase
    },
    tagPrivileges: {
        [key: string]: PrivilegeBase
    },
    permManPrivileges: {
        [key: string]: PrivilegeBase
    },
    service: string
}

export interface NormalizedResources {
    [key: string]: NormalizedResource
}

export interface PrivilegeBase {
    privilege: string,
    description: string,
    privConditions: ImportConditions,
    dependentActions: string[],
    accessLevel: AccessLevel,
    apiDocumentationLink: string
}

export interface PrivMap extends PrivilegeBase {
    required: boolean
}

export interface NormalizedPrivilege extends PrivilegeBase {
    resources: {
        [key: string]: (ResourceBase & {
            required: boolean
        })
    },
    service: string
}

export interface NormalizedPrivileges {
    [key: string]: NormalizedPrivilege
}

export interface NormalizedService {
    service: string,
    resources: string[],
    privileges: string[]
}
