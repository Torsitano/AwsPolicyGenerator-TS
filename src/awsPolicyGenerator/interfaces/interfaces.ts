export enum AccessLevel {
    LIST = 'List',
    READ = 'Read',
    WRITE = 'Write',
    PERMISSIONS_MANAGEMENT = 'Permissions management',
    TAGGING = 'Tagging',
}

export type Access = `${AccessLevel}`
export type PrivilegeLevel = 'listPrivileges' | 'readPrivileges' | 'writePrivileges' | 'permManPrivileges' | 'tagPrivileges'

export interface ServiceSelection {
    service: string
    access: readonly Access[]
}

export interface ResourceSelection extends ServiceSelection {
    resource: string
}

export type ServiceGrant = ServiceSelection & { resource?: never, arn?: never }

export interface AddActionsForResourceParams {
    service: string
    resource: string
    privLevels: readonly PrivilegeLevel[]
    resourceArn?: string
}

export type Grant = ResourceSelection & { arn?: string }
export type ConditionValue = string | number | boolean
export type StatementCondition = Record<string, Record<string, ConditionValue | ConditionValue[]>>

export enum Effect {
    ALLOW = 'Allow',
    DENY = 'Deny',
}

export interface PolicyStatement {
    Sid?: string
    Effect: `${Effect}`
    Action: string[]
    Resource: string[]
    Condition?: StatementCondition
}

export interface PolicyDocument {
    Version: '2012-10-17'
    Statement: PolicyStatement[]
}
