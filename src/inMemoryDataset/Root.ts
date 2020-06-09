import * as d from "../types"
import { RootErrorsAggregator } from "./implementation/ErrorManager"
import { Global } from "./Global"
import { Node } from "./implementation/Node"
import { initializeNode } from "./initializeNode"
import * as syncAPI from "../syncAPI"


export class RootImp {
    public readonly errorsAggregator = new RootErrorsAggregator()
    public readonly global = new Global()
    public readonly schema: d.Schema
    public readonly rootNode: Node
    public readonly internalSchemaSpecification: syncAPI.InternalSchemaSpecification

    constructor(internalSchemaSpecification: syncAPI.InternalSchemaSpecification, schema: d.Schema) {
        this.internalSchemaSpecification = internalSchemaSpecification
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
