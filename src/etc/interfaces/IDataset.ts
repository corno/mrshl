import * as buildAPI from "../../interfaces/buildAPI"

export enum InternalSchemaSpecificationType {
    Reference,
    None,
    Embedded
}

export type InternalSchemaSpecification =
    | [InternalSchemaSpecificationType.Embedded]
    | [InternalSchemaSpecificationType.Reference, { name: string }]
    | [InternalSchemaSpecificationType.None]

export interface IDataset {
    readonly schema: buildAPI.Schema
    readonly root: buildAPI.Node
    readonly documentComments: buildAPI.Comments
    readonly rootComments: buildAPI.Comments
}
