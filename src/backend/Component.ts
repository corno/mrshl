import * as bi from "../backendAPI/index"
import * as d from "../definition/index"
import * as rapi from "../readableAPI"
import * as wapi from "../writableAPI"
import * as s from "../serialize-deserialize/index"
import { IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { Node, NodeBuilder } from "./Node"
import { Comments } from "./Comments"

export class Component implements rapi.ReadableComponent, wapi.WritableComponent, bi.Component {
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(definition: d.Component) {
        this.node = new Node(definition.type.get().node, null)
    }
    public purgeChanges() {
        this.node.purgeChanges()
    }
}

export class ComponentBuilder implements s.ComponentBuilder {
    public node: NodeBuilder
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
    }
}
