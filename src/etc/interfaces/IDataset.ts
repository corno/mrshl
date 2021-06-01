import * as db5api from "../../db5api"

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
    readonly schema: db5api.Schema
    readonly root: db5api.Node
    readonly documentComments: db5api.Comments
    readonly rootComments: db5api.Comments
}
