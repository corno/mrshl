import * as md from "../metaDataSchema"
import { NodeBuilder } from "./syncAPIImplementation"
import { RootImp, AsyncDataset } from "./implementation"
import { IDataset } from "../loadDocument"
import { ISyncDataset } from "../syncAPI"

class SyncDataset implements ISyncDataset {
    public readonly schema: md.Schema
    public readonly root: NodeBuilder
    constructor(rootImp: RootImp) {
        this.schema = rootImp.schema

        this.root = new NodeBuilder(
            rootImp.schema["root type"].get().node,
            rootImp.rootNode,
            rootImp.global,
            rootImp.errorsAggregator,
            rootImp.errorsAggregator,
            false,
            null,
        )
    }
}

export function createInMemoryDataset(schema: md.Schema): IDataset {
    const rootImp = new RootImp("FOOO", schema)

    return {
        sync: new SyncDataset(rootImp),
        async: new AsyncDataset(rootImp),
    }
}