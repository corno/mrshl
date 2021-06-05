
export enum InternalSchemaSpecificationType {
    Reference,
    None,
    Embedded
}

export type InternalSchemaSpecification =
    | [InternalSchemaSpecificationType.Embedded]
    | [InternalSchemaSpecificationType.Reference, { name: string }]
    | [InternalSchemaSpecificationType.None]
