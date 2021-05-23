import * as t from "./types"
import * as syncapi from "./syncAPI"

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
    readonly schema: t.Schema
    readonly root: syncapi.Node
    readonly documentComments: syncapi.Comments
    readonly rootComments: syncapi.Comments
}
