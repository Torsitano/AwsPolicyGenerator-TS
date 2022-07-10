import { NormalizedResource } from './../interfaces/interfaces'



export class Resource {
    public readonly resource: string
    public readonly arn: string
    public readonly service: string
    public readonly allowedConditions: string[]
    public readonly listPrivileges: string[]
    public readonly readPrivileges: string[]
    public readonly writePrivileges: string[]
    public readonly permManPrivileges: string[]
    public readonly tagPrivileges: string[]


    constructor ( resourceDefinition: NormalizedResource ) {
        this.resource = resourceDefinition.resourceName
        this.arn = resourceDefinition.resourceArn
        this.service = resourceDefinition.service
        this.allowedConditions = Object.keys( resourceDefinition.resourceConditions ).sort()
        this.listPrivileges = Object.keys( resourceDefinition.listPrivileges ).sort()
        this.readPrivileges = Object.keys( resourceDefinition.readPrivileges ).sort()
        this.writePrivileges = Object.keys( resourceDefinition.writePrivileges ).sort()
        this.permManPrivileges = Object.keys( resourceDefinition.permManPrivileges ).sort()
        this.tagPrivileges = Object.keys( resourceDefinition.tagPrivileges ).sort()
    }


}