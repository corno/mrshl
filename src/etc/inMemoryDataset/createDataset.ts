import * as md from "../interfaces/types"
import * as sync from "./syncAPIImplementation"
import { RootImp } from "./Root"
import { IDataset } from "../dataset"
import * as id from "../interfaces/IDataset"
import * as asyncAPIImp from "./asyncAPIImplementation"
import { Comments } from "./implementation"

class SyncDataset implements id.IDataset {
    public readonly schema: md.Schema
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

export function createInMemoryDataset(schema: md.Schema): IDataset {
    const rootImp = new RootImp(schema)
    const syncDataset = new SyncDataset(rootImp)
    return {
        sync: syncDataset,
        async: new asyncAPIImp.Dataset(rootImp, rootImp.global, syncDataset),
    }
}