/* eslint
    "max-classes-per-file": off,
*/

import * as syncAPI from "../syncAPI"
import * as imp from "./implementation"
import * as d from "../definition"
import { Global } from "./implementation/Global"
import { IParentErrorsAggregator } from "./implementation/ErrorManager"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export class Component implements syncAPI.Component {
    public node: Node
    public readonly comments: imp.Comments
    constructor(
        definition: d.Component,
        component: imp.Component,
        global: Global,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
        keyProperty: d.Property | null,
    ) {
        this.node = new Node(
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

class Property implements syncAPI.Property {
    public readonly type: syncAPI.PropertyType
    public readonly isKeyProperty: boolean
    constructor(
        key: string,
        definition: d.Property,
        nodeImp: imp.Node,
        global: Global,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
        keyProperty: d.Property | null,
    ) {
        this.type = ((): syncAPI.PropertyType => {
            switch (definition.type[0]) {
                case "component": {
                    const $ = definition.type[1]
                    return ["component", new Component(
                        $,
                        nodeImp.getComponent(key),
                        global,
                        errorsAggregator,
                        subEntriesErrorsAggregator,
                        createdInNewContext,
                        keyProperty,
                    )]
                }
                case "collection": {
                    const $ = definition.type[1]
                    switch ($.type[0]) {
                        case "dictionary": {
                            const $$ = $.type[1]
                            return ["dictionary", new Dictionary(
                                new imp.Dictionary($$, nodeImp.getCollection(key)),
                                global,
                                createdInNewContext,
                            )]

                        }
                        case "list": {
                            const $$ = $.type[1]
                            return ["list", new List(
                                new imp.List($$, nodeImp.getCollection(key)),
                                global,
                                createdInNewContext,
                            )]

                        }
                        default:
                            return assertUnreachable($.type[0])
                    }
                }
                case "state group": {
                    //const $ = definition.type[1]
                    return ["state group", new StateGroup(
                        nodeImp.getStateGroup(key),
                        global,
                        createdInNewContext,
                    )]
                }
                case "value": {
                    //const $ = definition.type[1]
                    return ["value", new Value(
                        nodeImp.getValue(key),
                    )]
                }
                default:
                    return assertUnreachable(definition.type[0])
            }
        })()
        this.isKeyProperty = keyProperty === definition
    }
}

export class Node implements syncAPI.Node {
    private readonly node: imp.Node
    private readonly definition: d.Node
    private readonly errorsAggregator: IParentErrorsAggregator
    private readonly subEntriesErrorsAggregator: IParentErrorsAggregator
    private readonly global: Global
    private readonly createdInNewContext: boolean
    private readonly keyProperty: d.Property | null
    constructor(
        definition: d.Node,
        node: imp.Node,
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
        // this.definition.properties.forEach((p, key) => {
        //     switch (p.type[0]) {
        //         case "collection": {
        //             const $ = p.type[1]
        //             const collection = new Collection($, this.errorsAggregator, this.global)
        //             this.node.collections.add(key, collection)
        //             break
        //         }
        //         case "component": {
        //             const $ = p.type[1]
        //             const component = new Component(
        //                 $
        //                 )
        //             this.node.components.add(key, component)

        //             break
        //         }
        //         case "state group": {
        //             const $ = p.type[1]
        //             const stateGroup = new StateGroup($, this.errorsAggregator, this.subEntriesErrorsAggregator, this.global, this.createdInNewContext)
        //             this.node.stateGroups.add(key, stateGroup)
        //             break
        //         }
        //         case "value": {
        //             const $ = p.type[1]

        //             const val = new Value($, this.errorsAggregator, this.global, this.createdInNewContext)
        //             this.node.values.add(key, val)
        //             break
        //         }
        //         default:
        //             assertUnreachable(p.type[0])
        //     }
        // })
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
        const collection = this.node.collections.getUnsafe(key)
        return new Dictionary(new imp.Dictionary($.type[1], collection), this.global, this.createdInNewContext)
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
        const collection = this.node.collections.getUnsafe(key)
        return new List(new imp.List($.type[1], collection), this.global, this.createdInNewContext)
    }
    public getComponent(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "component") {
            throw new Error("not a component")
        }
        const component = this.node.components.getUnsafe(key)
        return new Component(
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

        return new StateGroup(sg, this.global, this.createdInNewContext)
    }
    public getValue(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "value") {
            throw new Error("not a value")
        }
        return this.node.values.getUnsafe(key)
    }
    public forEachProperty(callback: (property: syncAPI.Property, key: string) => void) {
        this.node.definition.properties.forEach((p, pKey) => {
            callback(
                new Property(
                    pKey,
                    p,
                    this.node,
                    this.global,
                    this.errorsAggregator,
                    this.subEntriesErrorsAggregator,
                    this.createdInNewContext,
                    this.keyProperty,
                ),
                pKey
            )
        })
    }
}


export class StateGroup implements syncAPI.StateGroup {
    private readonly imp: imp.StateGroup
    public readonly comments: imp.Comments
    private readonly global: Global
    private readonly createdInNewContext: boolean
    constructor(stateGroup: imp.StateGroup, global: Global, createdInNewContext: boolean) {
        this.imp = stateGroup
        this.global = global
        this.createdInNewContext = createdInNewContext
        this.comments = stateGroup.comments
    }
    public setState(stateName: string, _onError: (errorMessage: string) => void) {

        const stateDefinition = this.imp.definition.states.getUnsafe(stateName)
        const state = new imp.State(
            stateName,
            stateDefinition,
            this.global,
            false,
        )
        const node = new Node(
            stateDefinition.node,
            state.node,
            this.global,
            state.errorsAggregator,
            state.subentriesErrorsAggregator,
            this.createdInNewContext,
            null,
        )
        //FIXME call onError
        return new State(state, node)
    }
    public getCurrentState() {
        const currentStateImp = this.imp.getCurrentState()
        const stateName = currentStateImp.getStateKey()
        const stateDefinition = this.imp.definition.states.getUnsafe(stateName)
        const state = new imp.State(
            stateName,
            stateDefinition,
            this.global,
            false,
        )
        const node = new Node(
            stateDefinition.node,
            state.node,
            this.global,
            state.errorsAggregator,
            state.subentriesErrorsAggregator,
            this.createdInNewContext,
            null,
        )
        return new State(state, node)
    }
}

export class State implements syncAPI.State {
    public node: Node
    public comments: imp.Comments
    private readonly imp: imp.State
    constructor(stateImp: imp.State, nodeBuilder: Node) {
        this.node = nodeBuilder
        this.imp = stateImp
        this.comments = this.imp.comments
    }
    public getStateKey() {
        return this.imp.getStateKey()
    }
}

export class Entry implements syncAPI.Entry {
    public node: Node
    public comments: imp.Comments
    private readonly entry: imp.Entry
    private readonly collection: imp.Collection
    private readonly createdInNewContext: boolean
    constructor(
        collection: imp.Collection,
        entry: imp.Entry,
        createdInNewContext: boolean,
        keyProperty: d.Property | null,
    ) {
        this.comments = entry.comments
        this.entry = entry
        this.collection = collection
        this.createdInNewContext = createdInNewContext
        this.node = new Node(
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
        const entryPlaceHolder = new imp.EntryPlaceholder(this.entry, this.collection, this.collection.global, this.createdInNewContext)
        this.collection.insert(entryPlaceHolder)
    }
}

export class Dictionary implements syncAPI.Dictionary {
    public readonly imp: imp.Dictionary
    private readonly createdInNewContext: boolean
    private readonly global: Global
    constructor(
        dictionaryImp: imp.Dictionary,
        global: Global,
        createdInNewContext: boolean,
    ) {
        this.imp = dictionaryImp
        this.global = global
        this.createdInNewContext = createdInNewContext
    }
    public createEntry() {
        const entry = new imp.Entry(
            this.imp.collection.nodeDefinition,
            this.global,
            this.imp.collection.keyProperty
        )
        return new Entry(this.imp.collection, entry, this.createdInNewContext, this.imp.collection.keyProperty)
    }
    public forEachEntry(callback: (entry: syncAPI.Entry, key: string) => void) {
        const keyPropertyName = this.imp.definition["key property"].name
        this.imp.collection.entries.forEach(e => {
            if (e.status.get()[0] !== "inactive") {
                callback(
                    new Entry(
                        this.imp.collection,
                        e.entry,
                        this.createdInNewContext,
                        null,
                    ),
                    e.entry.node.values.getUnsafe(keyPropertyName).value.get()
                )
            }
        })
    }
}


export class List implements syncAPI.List {
    private readonly imp: imp.List
    private readonly global: Global
    private readonly createdInNewContext: boolean
    constructor(
        listImp: imp.List,
        global: Global,
        createdInNewContext: boolean,
    ) {
        this.imp = listImp
        this.global = global
        this.createdInNewContext = createdInNewContext
    }
    public createEntry() {
        const entry = new imp.Entry(this.imp.collection.nodeDefinition, this.global, this.imp.collection.keyProperty)
        return new Entry(this.imp.collection, entry, this.createdInNewContext, this.imp.collection.keyProperty)
    }
    public forEachEntry(callback: (entry: syncAPI.Entry) => void) {
        this.imp.collection.entries.forEach(e => {
            if (e.status.get()[0] !== "inactive") {
                callback(new Entry(
                    this.imp.collection,
                    e.entry,
                    this.createdInNewContext,
                    null,
                ))
            }
        })
    }
}

export class Value implements syncAPI.Value {
    public comments: imp.Comments
    private readonly imp: imp.Value
    readonly isQuoted: boolean
    constructor(valueImp: imp.Value) {
        this.imp = valueImp
        this.comments = valueImp.comments
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