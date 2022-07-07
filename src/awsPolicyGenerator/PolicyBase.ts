

export interface Base {
    toYaml(): string,
    toJson(): string,
    // permissionLevels(): string[],
    // services(): string[]
}

export abstract class PolicyBase implements Base {

    abstract toYaml(): string


    abstract toJson(): string

    // abstract permissionLevels(): string[]
    // abstract services(): string[]

}