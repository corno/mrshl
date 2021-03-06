import * as astncore from "astn-core"
import * as g from "./genericimp"
import { Global } from "./Global"
import { Node } from "./internals/Node"
import { initializeNode } from "./initializeNode"
import { IParentErrorsAggregator } from "./internals"


export class RootErrorsAggregator implements IParentErrorsAggregator {
    public readonly isAttached = new g.ReactiveValue<boolean>(true)
    public readonly errorCount: g.ReactiveValue<number>
    constructor() {
        this.errorCount = new g.ReactiveValue<number>(0)
    }
    public add(errorCount: number):void {
        this.errorCount.update(this.errorCount.get() + errorCount)
    }
}

export class RootImp {
    public readonly errorsAggregator = new RootErrorsAggregator()
    public readonly global = new Global()
    public readonly schema: astncore.Schema
    public readonly rootNode: Node

    constructor(schema: astncore.Schema) {
        this.rootNode = new Node(
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
