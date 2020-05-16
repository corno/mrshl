import * as bi from "../backendAPI/index"
import * as d from "../definition/index"
import * as s from "../serialize-deserialize/index"
import { IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { Node, NodeBuilder } from "./Node"

export class Component implements s.SerializableComponent, bi.Component {
    public readonly node = new Node()
    public getNode() {
        return this.node
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
        createdInNewContext: boolean
    ) {
        this.node = new NodeBuilder(definition.type.get().node, component.node, global, errorsAggregator, subEntriesErrorsAggregator, createdInNewContext)
    }
}
