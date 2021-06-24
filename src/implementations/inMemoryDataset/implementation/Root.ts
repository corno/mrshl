import * as def from "../../../deserialize/interfaces/typedParserDefinitions"
import { RootErrorsAggregator } from "./internals/ErrorManager"
import { Global } from "./Global"
import { Node } from "./internals/Node"
import { initializeNode } from "./initializeNode"

export class RootImp {
    public readonly errorsAggregator = new RootErrorsAggregator()
    public readonly global = new Global()
    public readonly schema: def.Schema
    public readonly rootNode: Node

    constructor(schema: def.Schema) {
        this.rootNode = new Node(
            null,
            node => {
                initializeNode(
                    node,
                    schema["root type"].get().node,
                    this.global.errorManager,
                    this.errorsAggregator,
                    this.errorsAggregator,
                    false
                )
            }
        )
        this.schema = schema
        this.global = new Global()
    }
}

export class Command {
    public readonly execute: () => void
    constructor(execute: () => void) {
        this.execute = execute
    }
}
