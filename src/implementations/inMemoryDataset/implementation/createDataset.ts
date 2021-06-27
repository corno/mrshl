import * as def from "astn-core"
import * as buildAPI from "astn-core"
import * as buildImp from "./buildAPIImplementation"

import { RootImp } from "./Root"
import { IDataset } from "astn"
import * as id from "astn"
//import * as asyncAPIImp from "./asyncAPIImplementation"
import { Comments } from "./internals"
import { serialize } from "./serialize/serialize"

class SyncDataset implements id.IDataset2 {
    public readonly schema: def.Schema
    public readonly root: buildAPI.Node
    public readonly documentComments = new Comments()
    public readonly rootComments = new Comments()
    constructor(rootImp: RootImp) {
        this.schema = rootImp.schema
        this.root = buildImp.createNode(
            rootImp.rootNode,
            rootImp.schema["root type"].get().node,
            rootImp.global,
        )
    }
}

export function createInMemoryDataset(schema: def.Schema): IDataset {
    const rootImp = new RootImp(schema)
    const syncDataset = new SyncDataset(rootImp)
    return {
        build: syncDataset,
        //async: asyncAPIImp.createDataset(rootImp, rootImp.global, syncDataset),
        serialize: (internalSchemaSpecification, style, writer) => {
            return serialize(
                rootImp,
                internalSchemaSpecification,
                style,
                writer,
            )
        },
    }
}