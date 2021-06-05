import { Schema } from "../definitions";
import * as buildAPI from "./builders"

export interface IDataset {
    readonly schema: Schema
    readonly root: buildAPI.Node
    readonly documentComments: buildAPI.Comments
    readonly rootComments: buildAPI.Comments
}
