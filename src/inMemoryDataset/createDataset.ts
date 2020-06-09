import * as md from "../types"
import * as sync from "./syncAPIImplementation"
import { RootImp } from "./Root"
import { IDataset } from "../dataset"
import * as syncAPI from "../syncAPI"
import * as asyncAPIImp from "./asyncAPIImplementation"

class SyncDataset implements syncAPI.IDataset {
    public readonly schema: md.Schema
    public readonly root: sync.Node
    public readonly internalSchemaSpecification: syncAPI.InternalSchemaSpecification
    constructor(rootImp: RootImp) {
        this.schema = rootImp.schema
        this.internalSchemaSpecification = rootImp.internalSchemaSpecification
        this.root = new sync.Node(
            rootImp.rootNode,
            rootImp.schema["root type"].get().node,
            rootImp.global,
            null,
        )
    }
}

export function createInMemoryDataset(schema: md.Schema, internalSchemaSpecification: syncAPI.InternalSchemaSpecification, compact: boolean): IDataset {
    const rootImp = new RootImp(internalSchemaSpecification, schema)
    const syncDataset = new SyncDataset(rootImp)
    return {
        sync: syncDataset,
        async: new asyncAPIImp.Dataset(rootImp, rootImp.global, syncDataset, compact),
    }
}