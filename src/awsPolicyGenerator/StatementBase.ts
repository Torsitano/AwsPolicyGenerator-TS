

export interface Base {
    toYaml(): string,
    fromYaml( input: string ): void,
    toJson(): string,
    fromJson( input: string ): void
    permissionLevels(): string[],
    services(): string[]
}

export abstract class StatementBase implements Base {

    abstract toYaml(): string
    abstract fromYaml( input: string ): void
    abstract toJson(): string
    abstract fromJson( input: string ): void
    abstract permissionLevels(): string[]
    abstract services(): string[]

}