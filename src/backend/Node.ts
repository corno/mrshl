import * as g from "../generics/index"
import * as bi from "../backendAPI/index"
import * as d from "../definition/index"
import * as s from "../serialize-deserialize/index"
import { Collection, CollectionBuilder } from "./Collection"
import { Component, ComponentBuilder } from "./Component"
import { IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { defaultInitializeState, State, StateBuilder, StateGroup } from "./StateGroup"
import { createValue, Value } from "./Value"

export class Node implements s.SerializableNode, bi.Node {
    public readonly collections = new g.Dictionary<Collection>({})
    public readonly components = new g.Dictionary<Component>({})
    public readonly stateGroups = new g.Dictionary<StateGroup>({})
    public readonly values = new g.Dictionary<Value>({})
    public getCollection(key: string) {
        return this.collections.get(key)
    }
    public getComponent(key: string) {
        return this.components.get(key)
    }
    public getStateGroup(key: string) {
        return this.stateGroups.get(key)
    }
    public getValue(key: string) {
        return this.values.get(key)
    }
    public purgeChanges() {
        this.collections.forEach(c => c.purgeChanges())
        this.components.forEach(c => c.purgeChanges())
        this.stateGroups.forEach(sg => sg.purgeChanges())
        this.values.forEach(v => v.purgeChanges())
    }
}

export function defaultInitializeNode(
    definition: d.Node,
    node: Node,
    global: Global,
    errorsAggregator: IParentErrorsAggregator,
    subentriesErrorsAggregator: IParentErrorsAggregator,
    createdInNewContext: boolean
) {
    definition.properties.forEach((property, key) => {
        switch (property.type[0]) {
            case "collection": {
                const $ = property.type[1]
                node.collections.add(key, new Collection($, subentriesErrorsAggregator, global))
                break
            }
            case "component": {
                const $ = property.type[1]
                const comp = new Component()
                defaultInitializeNode(
                    $.type.get().node,
                    comp.node,
                    global,
                    errorsAggregator,
                    subentriesErrorsAggregator,
                    createdInNewContext,
                )
                node.components.add(key, comp)
                break
            }
            case "state group": {
                const $ = property.type[1]
                const state = defaultInitializeState(
                    $["default state"].get(),
                    global,
                    createdInNewContext
                )
                const sg = new StateGroup(
                    state,
                    $,
                    $["default state"].get().key,
                    errorsAggregator,
                    subentriesErrorsAggregator,
                    global,
                    createdInNewContext,
                )
                node.stateGroups.add(key, sg)
                break
            }
            case "value": {
                const $ = property.type[1]
                node.values.add(key, createValue($, $["default value"], errorsAggregator, global, createdInNewContext))
                break
            }
            default:
                return g.assertUnreachable(property.type[0])
        }
    })
}

export class NodeBuilder implements s.NodeBuilder {
    private readonly node: Node
    private readonly definition: d.Node
    private readonly errorsAggregator: IParentErrorsAggregator
    private readonly subEntriesErrorsAggregator: IParentErrorsAggregator
    private readonly global: Global
    private readonly createdInNewContext: boolean
    constructor(definition: d.Node, node: Node, global: Global, errorsAggregator: IParentErrorsAggregator, subEntriesErrorsAggregator: IParentErrorsAggregator, createdInNewContext: boolean) {
        this.definition = definition
        this.node = node
        this.errorsAggregator = errorsAggregator
        this.subEntriesErrorsAggregator = subEntriesErrorsAggregator
        this.global = global
        this.createdInNewContext = createdInNewContext
    }
    public addCollection(key: string) {
        const propDef = this.definition.properties.get(key)
        if (propDef.type[0] !== "collection") {
            throw new Error("not a collection")
        }
        const collection = new Collection(propDef.type[1], this.errorsAggregator, this.global)
        this.node.collections.add(key, collection)
        return new CollectionBuilder(collection, this.createdInNewContext)
    }
    public addComponent(key: string) {
        const propDef = this.definition.properties.get(key)
        if (propDef.type[0] !== "component") {
            throw new Error("not a component")
        }
        const component = new Component()
        this.node.components.add(key, component)
        return new ComponentBuilder(propDef.type[1], component, this.global, this.errorsAggregator, this.subEntriesErrorsAggregator, this.createdInNewContext)
    }
    public addStateGroup(key: string, stateName: string) {
        const propDef = this.definition.properties.get(key)
        if (propDef.type[0] !== "state group") {
            throw new Error("not a state group")
        }
        const stateDefinition = propDef.type[1].states.get(stateName)
        const state = new State(stateName)
        const stateGroup = new StateGroup(state, propDef.type[1], stateName, this.errorsAggregator, this.subEntriesErrorsAggregator, this.global, this.createdInNewContext)
        this.node.stateGroups.add(key, stateGroup)
        const nodeBuilder = new NodeBuilder(stateDefinition.node, state.node, this.global, state.errorsAggregator, state.subentriesErrorsAggregator, this.createdInNewContext)
        return new StateBuilder(nodeBuilder)
    }
    public addValue(key: string, value: string) {
        const propDef = this.definition.properties.get(key)
        if (propDef.type[0] !== "value") {
            throw new Error("not a value")
        }
        this.node.values.add(key, new Value(propDef.type[1], value, this.errorsAggregator, this.global, this.createdInNewContext))
    }
}
