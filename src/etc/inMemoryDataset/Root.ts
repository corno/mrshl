import * as db5api from "../../db5api"
import { RootErrorsAggregator } from "./implementation/ErrorManager"
import { Global } from "./Global"
import { Node } from "./implementation/Node"
import { initializeNode } from "./initializeNode"

export class RootImp {
    public readonly errorsAggregator = new RootErrorsAggregator()
    public readonly global = new Global()
    public readonly schema: db5api.Schema
    public readonly rootNode: Node

    constructor(schema: db5api.Schema) {
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
