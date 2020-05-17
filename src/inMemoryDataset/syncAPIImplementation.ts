/* eslint
    "max-classes-per-file": off,
*/

import * as syncAPI from "../syncAPI"
import { Comments } from "./implementation/Comments"
import { Value } from "./implementation/Value"
import { Node, Property } from "./implementation/Node"
import { State, StateGroup } from "./implementation/StateGroup"
import { Component } from "./implementation/Component"
import { List, Dictionary, Collection, Entry, EntryPlaceholder } from "./implementation/Collection"
import * as d from "../definition/index"
import { Global } from "./implementation/Global"
import { IParentErrorsAggregator } from "./implementation/ErrorManager"

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

export class ComponentBuilder implements syncAPI.Component {
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

class PropertyBuilder implements syncAPI.Property {
    private readonly imp: Property
    public readonly type: syncAPI.PropertyType
    public readonly isKeyProperty: boolean
    constructor(imp: Property) {
        this.imp = imp
        this.type = imp.type
        this.isKeyProperty = this.imp.isKeyProperty
    }
}

export class NodeBuilder implements syncAPI.Node {
    private readonly node: Node
    private readonly definition: d.Node
    private readonly errorsAggregator: IParentErrorsAggregator
    private readonly subEntriesErrorsAggregator: IParentErrorsAggregator
    private readonly global: Global
    private readonly createdInNewContext: boolean
    private readonly keyProperty: d.Property | null
    constructor(
        definition: d.Node,
        node: Node,
        global: Global,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
        keyProperty: d.Property | null,
    ) {
        this.definition = definition
        this.node = node
        this.errorsAggregator = errorsAggregator
        this.subEntriesErrorsAggregator = subEntriesErrorsAggregator
        this.global = global
        this.createdInNewContext = createdInNewContext
        this.keyProperty = keyProperty
        this.definition.properties.forEach((p, key) => {
            switch (p.type[0]) {
                case "collection": {
                    const $ = p.type[1]
                    const collection = new Collection($, this.errorsAggregator, this.global)
                    this.node.collections.add(key, collection)
                    break
                }
                case "component": {
                    const $ = p.type[1]
                    const component = new Component($)
                    this.node.components.add(key, component)

                    break
                }
                case "state group": {
                    const $ = p.type[1]
                    const stateGroup = new StateGroup($, this.errorsAggregator, this.subEntriesErrorsAggregator, this.global, this.createdInNewContext)
                    this.node.stateGroups.add(key, stateGroup)
                    break
                }
                case "value": {
                    const $ = p.type[1]

                    const val = new Value($, this.errorsAggregator, this.global, this.createdInNewContext)
                    this.node.values.add(key, val)
                    break
                }
                default:
                    assertUnreachable(p.type[0])
            }
        })
    }
    public getDictionary(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "collection") {
            throw new Error("not a collection")
        }
        const $ = propDef.type[1]
        if ($.type[0] !== "dictionary") {
            throw new Error("not a dicionary")
        }
        const dictionary = this.node.dictionaries.getUnsafe(key)
        return new DictionaryBuilder(dictionary, this.createdInNewContext)
    }
    public getList(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "collection") {
            throw new Error("not a collection")
        }
        const $ = propDef.type[1]
        if ($.type[0] !== "list") {
            throw new Error("not a list")
        }
        const list = this.node.lists.getUnsafe(key)
        return new ListBuilder(list, this.createdInNewContext)
    }
    public getComponent(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "component") {
            throw new Error("not a component")
        }
        const component = this.node.components.getUnsafe(key)
        return new ComponentBuilder(
            propDef.type[1],
            component,
            this.global,
            this.errorsAggregator,
            this.subEntriesErrorsAggregator,
            this.createdInNewContext,
            this.keyProperty,
        )
    }
    public getStateGroup(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "state group") {
            throw new Error("not a state group")
        }
        const sg = this.node.getStateGroup(key)

        return new StateGroupBuilder(sg, this.global, this.createdInNewContext)
    }
    public getValue(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "value") {
            throw new Error("not a value")
        }
        return this.node.values.getUnsafe(key)
    }
    public forEachProperty(callback: (property: syncAPI.Property, key: string) => void) {
        this.node.forEachProperty((p, pKey) => {
            callback(new PropertyBuilder(p), pKey)
        })
    }
}


export class StateGroupBuilder implements syncAPI.StateGroup {
    private readonly imp: StateGroup
    public readonly comments: Comments
    private readonly global: Global
    private readonly createdInNewContext: boolean
    constructor(stateGroup: StateGroup, global: Global, createdInNewContext: boolean) {
        this.imp = stateGroup
        this.global = global
        this.createdInNewContext = createdInNewContext
        this.comments = stateGroup.comments
    }
    public setState(stateName: string, _onError: (errorMessage: string) => void) {

        const stateDefinition = this.imp.definition.states.getUnsafe(stateName)
        const state = new State(stateName, stateDefinition)
        const nodeBuilder = new NodeBuilder(
            stateDefinition.node,
            state.node,
            this.global,
            state.errorsAggregator,
            state.subentriesErrorsAggregator,
            this.createdInNewContext,
            null,
        )
        //FIXME call onError
        return new StateBuilder(state, nodeBuilder)
    }
    public getCurrentState() {
        return this.imp.getCurrentState()
    }
}

export class StateBuilder implements syncAPI.State {
    public node: NodeBuilder
    public comments: Comments
    private readonly imp: State
    constructor(imp: State, nodeBuilder: NodeBuilder) {
        this.node = nodeBuilder
        this.imp = imp
        this.comments = this.imp.comments
    }
    public getStateKey() {
        return this.imp.getStateKey()
    }
}

export class EntryBuilder implements syncAPI.Entry {
    public node: NodeBuilder
    public comments: Comments
    private readonly entry: Entry
    private readonly collection: Collection
    private readonly createdInNewContext: boolean
    constructor(
        collection: Collection,
        entry: Entry,
        createdInNewContext: boolean,
        keyProperty: d.Property | null,
    ) {
        this.comments = entry.comments
        this.entry = entry
        this.collection = collection
        this.createdInNewContext = createdInNewContext
        this.node = new NodeBuilder(
            collection.nodeDefinition,
            entry.node,
            collection.global,
            entry.errorsAggregator,
            entry.subentriesErrorsAggregator,
            createdInNewContext,
            keyProperty,
        )
    }
    public insert() {
        const entryPlaceHolder = new EntryPlaceholder(this.entry, this.collection, this.collection.global, this.createdInNewContext)
        this.collection.insert(entryPlaceHolder)
    }
}

export class DictionaryBuilder implements syncAPI.Dictionary {
    public readonly imp: Dictionary
    private readonly createdInNewContext: boolean
    constructor(
        dictionary: Dictionary,
        createdInNewContext: boolean,
    ) {
        this.imp = dictionary
        this.createdInNewContext = createdInNewContext
    }
    public createEntry() {
        const entry = new Entry(this.imp.collection.nodeDefinition, this.imp.collection.keyProperty)
        return new EntryBuilder(this.imp.collection, entry, this.createdInNewContext, this.imp.collection.keyProperty)
    }
    public forEachEntry(callback: (entry: syncAPI.Entry, key: string) => void) {
        const keyProperty = this.imp.definition["key property"].get()
        this.imp.forEachEntry((e, eKey) => {
            callback(
                new EntryBuilder(
                    this.imp.collection,
                    e,
                    this.createdInNewContext,
                    keyProperty,
                ),
                eKey
            )
        })
    }
}


export class ListBuilder implements syncAPI.List {
    private readonly list: List
    private readonly createdInNewContext: boolean
    constructor(
        list: List,
        createdInNewContext: boolean,
    ) {
        this.list = list
        this.createdInNewContext = createdInNewContext
    }
    public createEntry() {
        const entry = new Entry(this.list.collection.nodeDefinition, this.list.collection.keyProperty)
        return new EntryBuilder(this.list.collection, entry, this.createdInNewContext, this.list.collection.keyProperty)
    }
    public forEachEntry(callback: (entry: syncAPI.Entry) => void) {
        this.list.forEachEntry(e => {
            callback(new EntryBuilder(
                this.list.collection,
                e,
                this.createdInNewContext,
                null,
            ))
        })
    }
}

export class ValueBuilder implements syncAPI.Value {
    public comments: Comments
    private readonly imp: Value
    readonly isQuoted: boolean
    constructor(imp: Value) {
        this.imp = imp
        this.comments = imp.comments
        this.isQuoted = false//FIXME
    }
    public setValue(value: string, onError: (message: string) => void) {
        this.imp.setValue(value, onError)
    }
    public getValue() {
        return this.imp.getValue()
    }
    public getSuggestions() {
        return this.imp.getSuggestions()
    }
}