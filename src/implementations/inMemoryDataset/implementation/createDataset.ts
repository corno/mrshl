import * as def from "../../../interfaces/typedParserDefinitions"
import * as sync from "./buildAPIImplementation"
import { RootImp } from "./Root"
import { IDataset } from "../../../etc/interfaces/dataset"
import * as id from "../../../interfaces/buildAPI/IDataset"
import * as asyncAPIImp from "./asyncAPIImplementation"
import { Comments } from "./internals"
import { serialize } from "./serialize/serialize"

class SyncDataset implements id.IDataset {
    public readonly schema: def.Schema
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

export function createInMemoryDataset(schema: def.Schema): IDataset {
    const rootImp = new RootImp(schema)
    const syncDataset = new SyncDataset(rootImp)
    return {
        build: syncDataset,
        async: asyncAPIImp.createDataset(rootImp, rootImp.global, syncDataset),
        serialize: (internalSchemaSpecification, writer) => {
            return serialize(
                rootImp,
                internalSchemaSpecification,
                writer,
            )
        },
    }
}