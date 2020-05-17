import * as md from "../metaDataSchema"
import { NodeBuilder } from "./syncAPIImplementation"
import { RootImp } from "./implementation"

export class Dataset {
    public readonly schema: md.Schema
    public readonly root: NodeBuilder
    constructor(definition: md.Schema) {
        this.schema = definition

        const rootImp = new RootImp("FOOO", definition)

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

export function createDataset(schema: md.Schema) {
    return new Dataset(schema)
}