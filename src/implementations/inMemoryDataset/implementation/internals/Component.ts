import * as astncore from "astn-core"
import { Node } from "./Node"
import { Comments } from "./Comments"
import { IParentErrorsAggregator, ErrorManager } from "./ErrorManager"
import { initializeNode } from "../initializeNode"

export class Component {
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(
        definition: astncore.ComponentDefinition,
        errorManager: ErrorManager,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
    ) {
        this.node = new Node(
            node => {
                initializeNode(
                    node,
                    definition.type.get().node,
                    errorManager,
                    errorsAggregator,
                    subEntriesErrorsAggregator,
                    createdInNewContext,
                )
            }
        )
    }
}

