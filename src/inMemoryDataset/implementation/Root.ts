import * as d from "../../definition"
import { RootErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { Node } from "./Node"

export class RootImp {
    public readonly errorsAggregator = new RootErrorsAggregator()
    public readonly global = new Global()
    public readonly schema: d.Schema
    public readonly rootNode: Node
    public readonly schemaPath: string
    constructor(schemaPath: string, schema: d.Schema) {
        this.schemaPath = schemaPath
        this.rootNode = new Node(
            schema["root type"].get().node,
            this.global,
            this.errorsAggregator,
            this.errorsAggregator,
            false,
            null
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
