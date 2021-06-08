import { Schema as build } from "../typedParserDefinitions";
import * as buildAPI from "./builders"

export interface IDataset {
    readonly schema: build
    readonly root: buildAPI.Node
    readonly documentComments: buildAPI.Comments
    readonly rootComments: buildAPI.Comments
}
