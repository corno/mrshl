import * as bi from "../../asyncAPI"
import * as d from "../../definition"
import { Node } from "./Node"
import { Comments } from "./Comments"
import { Global } from "./Global"
import { IParentErrorsAggregator } from "./ErrorManager"

export class Component implements bi.Component {
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(
        definition: d.Component,
        global: Global,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
    ) {
        this.node = new Node(
            definition.type.get().node,
            global,
            errorsAggregator,
            subEntriesErrorsAggregator,
            createdInNewContext,
            null,
        )
    }
    public purgeChanges() {
        this.node.purgeChanges()
    }
}

