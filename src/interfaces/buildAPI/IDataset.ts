import * as buildAPI from "."

export interface IDataset {
    readonly schema: buildAPI.Schema
    readonly root: buildAPI.Node
    readonly documentComments: buildAPI.Comments
    readonly rootComments: buildAPI.Comments
}
