import * as streamVal from "../../interfaces/streamingValidationAPI"
import * as sync from "./buildAPIImplementation"
import { RootImp } from "./Root"
import { IDataset } from "../interfaces/dataset"
import * as id from "../../interfaces/buildAPI/IDataset"
import * as asyncAPIImp from "./asyncAPIImplementation"
import { Comments } from "./implementation/internals"

class SyncDataset implements id.IDataset {
    public readonly schema: streamVal.Schema
    public readonly root: sync.Node
    public readonly documentComments = new Comments()
    public readonly rootComments = new Comments()
    constructor(rootImp: RootImp) {
        this.schema = rootImp.schema
        this.root = new sync.Node(
            rootImp.rootNode,
            rootImp.schema["root type"].get().node,
            rootImp.global,
            null,
        )
    }
}

export function createInMemoryDataset(schema: streamVal.Schema): IDataset {
    const rootImp = new RootImp(schema)
    const syncDataset = new SyncDataset(rootImp)
    return {
        sync: syncDataset,
        async: new asyncAPIImp.Dataset(rootImp, rootImp.global, syncDataset),
    }
}