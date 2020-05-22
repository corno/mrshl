import * as md from "../metaDataSchema"
import * as sync from "./syncAPIImplementation"
import { RootImp } from "./Root"
import { IDataset } from "../dataset"
import * as syncAPI from "../syncAPI"
import * as asyncAPIImp from "./asyncAPIImplementation"

class SyncDataset implements syncAPI.IDataset {
    public readonly schema: md.Schema
    public readonly root: sync.Node
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
    const rootImp = new RootImp("FOOO", schema)

    return {
        sync: new SyncDataset(rootImp),
        async: new asyncAPIImp.Dataset(rootImp, rootImp.global),
    }
}