import * as d from "../../definition"
import { Node } from "./Node"
import { Comments } from "./Comments"
import { IParentErrorsAggregator, ErrorManager } from "./ErrorManager"

export class Component {
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(
        definition: d.Component,
        errorManager: ErrorManager,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
    ) {
        this.node = new Node(
            definition.type.get().node,
            errorManager,
            errorsAggregator,
            subEntriesErrorsAggregator,
            createdInNewContext,
            null,
        )
    }
}

