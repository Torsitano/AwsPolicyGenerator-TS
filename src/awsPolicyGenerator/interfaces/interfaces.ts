
export interface IamDefinition {
    [key: string]: {
        serviceName: string,
        prefix: string,
        serviceAuthorizationUrl: string,
        privileges: {
            [key: string]: PrivilegeProperties
        },
        resources: {
            [key: string]: ResourceProperties
        },
        conditions: {
            [key: string]: ConditionTypeProperties
        }
    }
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

export interface ConditionTypeDefinition {
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

export interface ConditionProperties {
    [key: string]: {
        condition: string,
        description: string,
        type: ConditionType
    }
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
    resourceConditions: ConditionProperties,
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
    privConditions: ConditionProperties,
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


// let test: NormalizedPrivilege = {
//     privilege: '',
//     description: '',
//     service: '',
//     conditionKeys: [],
//     dependentActions: [],
//     accessLevel: AccessLevel.LIST,
//     resources: [{
//         required: true,
//         resourceArn: '',
//         resourceName: ''
//     },
//     {
//         required: false,
//         resourceArn: '',
//         resourceName: ''
//     }]
// }

// let test2: NormalizedResource = {
//     resourceName: '',
//     resourceArn: '',
//     service: '',
//     conditionKeys: [],
//     privileges: [{
//         accessLevel: AccessLevel.LIST,
//         conditionKeys: [],
//         dependentActions: [],
//         description: '',
//         privilege: ''
//     }]
// }




// ############################
// ############################

export interface IAccessLevel {
    /**
     * Access level of the privilege
     * @experimental
     */
    readonly accessLevel: 'LIST' | 'READ' | 'WRITE' | 'PERMISSION_MANAGEMENT' | 'TAGGING'
}


export interface IAction {
    /**
     * Name of the Action
     * @experimental
     */
    readonly actionName: string

    /**
     * Description of the action
     * @experimental
     */
    readonly description: string

    /**
     * Other actions that this requires for successful execution
     * @experimental
     */
    readonly dependentActions?: string[]

    /**
     * Access level of the IAM Action
     * @experimental
     */
    readonly accessLevel: IAccessLevel

}

export interface IResource {
    /**
     * Type of a resource effected by an IAM Privilege
     * @experimental
     */
    readonly resourceName: string

    /**
     * Available condition keys for the resource
     * @experimental
     */
    readonly conditionKeys?: string[]

    /**
     * Format of the ARN for a resource
     * @experimental
     */
    readonly resourceArnFormat: string

    /**
     * Actions taken against the resource type
     * @param {string} actionName
     * @param {string} description
     * @param {string[]} dependentActions
     * @param {IAccessLevel} accessLevel
     * @experimental
     */
    readonly actions: IAction[]

}

export interface IResourceType{
    /**
     * Type of a resource effected by an IAM Privilege
     * @experimental
     */
     readonly resourceName: string

     /**
      * Available condition keys for the resource
      * @experimental
      */
     readonly conditionKeys?: string[]
 
     /**
      * Format of the ARN for a resource
      * @experimental
      */
     readonly resourceArnFormat: string

    /**
     * Is the resource required for the IAM Action
     * @experimental
     */
    readonly required: boolean

    /**
     * Any other actions that are required to complete this action
     * @experimental
     */
    readonly dependentActions: string[]

}


export interface IPrivilege extends IAction {

    /**
     * Name of the prefix for a command. ie: 'ec2' in 'ec2:RunInstances'
     * @experimental
     */
    readonly prefix: string

    /**
     * Documentation link for the API action
     * @experimental
     */
    readonly apiDocumentationLink: string

    /**
     * Resource types included in the action
     * @experimental
     */
    readonly resourceTypes?: IResourceType[]
}

