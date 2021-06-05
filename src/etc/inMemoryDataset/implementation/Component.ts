import * as streamVal from "../../../interfaces/streamingValidationAPI"
import { Node } from "./Node"
import { Comments } from "./Comments"
import { IParentErrorsAggregator, ErrorManager } from "./ErrorManager"
import { initializeNode } from "../initializeNode"

export class Component {
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(
        definition: streamVal.ComponentDefinition,
        errorManager: ErrorManager,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
    ) {
        this.node = new Node(
            null,
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

