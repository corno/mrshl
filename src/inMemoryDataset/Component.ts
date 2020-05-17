import * as bi from "../asynAPI"
import * as d from "../definition/index"
import * as dapi from "../syncAPI"
import { IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { Node, NodeBuilder } from "./Node"
import { Comments } from "./Comments"

export class Component implements bi.Component {
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(definition: d.Component) {
        this.node = new Node(definition.type.get().node, null)
    }
    public purgeChanges() {
        this.node.purgeChanges()
    }
}

export class ComponentBuilder implements dapi.Component {
    public node: NodeBuilder
    public readonly comments: Comments
    constructor(
        definition: d.Component,
        component: Component,
        global: Global,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
        keyProperty: d.Property | null,
    ) {
        this.node = new NodeBuilder(
            definition.type.get().node,
            component.node, global,
            errorsAggregator,
            subEntriesErrorsAggregator,
            createdInNewContext,
            keyProperty,
        )
        this.comments = component.comments
    }
}
