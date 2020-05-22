/* eslint
    "max-classes-per-file": off,
*/

import * as syncAPI from "../syncAPI"
import * as imp from "./implementation"
import * as d from "../definition"
import { Global } from "./Global"
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
                        nodeImp.components.getUnsafe(key),
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
                                nodeImp.collections.getUnsafe(key),
                                $$,
                                global,
                                createdInNewContext,
                            )]

                        }
                        case "list": {
                            //const $$ = $.type[1]
                            return ["list", new List(
                                nodeImp.collections.getUnsafe(key),
                                //$$,
                                global,
                                createdInNewContext,
                            )]

                        }
                        default:
                            return assertUnreachable($.type[0])
                    }
                }
                case "state group": {
                    const $ = definition.type[1]
                    return ["state group", new StateGroup(
                        nodeImp.stateGroups.getUnsafe(key),
                        $,
                        global,
                        createdInNewContext,
                    )]
                }
                case "value": {
                    const $ = definition.type[1]
                    return ["value", new Value(
                        nodeImp.values.getUnsafe(key),
                        $,
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
    private readonly imp: imp.Node
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
        this.imp = node
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
        const collection = this.imp.collections.getUnsafe(key)
        return new Dictionary(collection, $.type[1], this.global, this.createdInNewContext)
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
        const collection = this.imp.collections.getUnsafe(key)
        return new List(collection, this.global, this.createdInNewContext)
    }
    public getComponent(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "component") {
            throw new Error("not a component")
        }
        const component = this.imp.components.getUnsafe(key)
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
        const sg = this.imp.stateGroups.getUnsafe(key)

        return new StateGroup(sg, propDef.type[1], this.global, this.createdInNewContext)
    }
    public getValue(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "value") {
            throw new Error("not a value")
        }
        return new Value(this.imp.values.getUnsafe(key), propDef.type[1])
    }
    public forEachProperty(callback: (property: syncAPI.Property, key: string) => void) {
        this.definition.properties.forEach((p, pKey) => {
            callback(
                new Property(
                    pKey,
                    p,
                    this.imp,
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
    private readonly definition: d.StateGroup
    constructor(stateGroup: imp.StateGroup, definition: d.StateGroup, global: Global, createdInNewContext: boolean) {
        this.imp = stateGroup
        this.global = global
        this.definition = definition
        this.createdInNewContext = createdInNewContext
        this.comments = stateGroup.comments
    }
    public setState(stateName: string, _onError: (errorMessage: string) => void) {

        const stateDefinition = this.definition.states.getUnsafe(stateName)
        const state = new imp.State(
            stateName,
            stateDefinition,
            this.global.errorManager,
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
        const currentStateImp = this.imp.currentState.get()
        const stateName = currentStateImp.key
        const stateDefinition = this.definition.states.getUnsafe(stateName)
        const state = new imp.State(
            stateName,
            stateDefinition,
            this.global.errorManager,
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
        return this.imp.key
    }
}

export class Entry implements syncAPI.Entry {
    public node: Node
    public comments: imp.Comments
    private readonly entry: imp.Entry
    private readonly collection: imp.Collection
    private readonly createdInNewContext: boolean
    constructor(
        collectionImp: imp.Collection,
        global: Global,
        entry: imp.Entry,
        createdInNewContext: boolean,
        keyProperty: d.Property | null,
    ) {
        this.comments = entry.comments
        this.entry = entry
        this.collection = collectionImp
        this.createdInNewContext = createdInNewContext
        this.node = new Node(
            collectionImp.nodeDefinition,
            entry.node,
            global,
            entry.errorsAggregator,
            entry.subentriesErrorsAggregator,
            createdInNewContext,
            keyProperty,
        )
    }
    public insert() {
        const entryPlaceHolder = new imp.EntryPlaceholder(this.entry, this.collection, this.createdInNewContext)

        entryPlaceHolder.entry.errorsAggregator.attach(entryPlaceHolder.parent.errorsAggregator)
        entryPlaceHolder.entry.subentriesErrorsAggregator.attach(entryPlaceHolder.parent.errorsAggregator)
        this.collection.entries.addEntry(entryPlaceHolder)
    }
}

export class Dictionary implements syncAPI.Dictionary {
    public readonly imp: imp.Collection
    private readonly definition: d.Dictionary
    private readonly createdInNewContext: boolean
    private readonly global: Global
    constructor(
        collectionImp: imp.Collection,
        definition: d.Dictionary,
        global: Global,
        createdInNewContext: boolean,
    ) {
        this.imp = collectionImp
        this.definition = definition
        this.global = global
        this.createdInNewContext = createdInNewContext
    }
    public createEntry() {
        const entry = new imp.Entry(
            this.imp.nodeDefinition,
            this.global.errorManager,
            this.imp.keyProperty
        )
        return new Entry(this.imp, this.global, entry, this.createdInNewContext, this.imp.keyProperty)
    }
    public forEachEntry(callback: (entry: syncAPI.Entry, key: string) => void) {
        const keyPropertyName = this.definition["key property"].name
        this.imp.entries.forEach(e => {
            if (e.status.get()[0] !== "inactive") {
                callback(
                    new Entry(
                        this.imp,
                        this.global,
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
    private readonly imp: imp.Collection
    //private readonly definition: d.List
    private readonly global: Global
    private readonly createdInNewContext: boolean
    constructor(
        collectionImp: imp.Collection,
        global: Global,
        createdInNewContext: boolean,
    ) {
        this.imp = collectionImp
        this.global = global
        this.createdInNewContext = createdInNewContext
    }
    public createEntry() {
        const entry = new imp.Entry(this.imp.nodeDefinition, this.global.errorManager, this.imp.keyProperty)
        return new Entry(this.imp, this.global, entry, this.createdInNewContext, this.imp.keyProperty)
    }
    public forEachEntry(callback: (entry: syncAPI.Entry) => void) {
        this.imp.entries.forEach(e => {
            if (e.status.get()[0] !== "inactive") {
                callback(new Entry(
                    this.imp,
                    this.global,
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
    private readonly definition: d.Value
    constructor(valueImp: imp.Value, definition: d.Value) {
        this.imp = valueImp
        this.comments = valueImp.comments
        this.isQuoted = false//FIXME
        this.definition = definition
    }
    public setValue(value: string, onError: (message: string) => void) {
        this.setValue(value, onError)
    }
    public getValue() {
        return this.imp.value.get()
    }
    public getSuggestions() {
        return [this.definition["default value"]]
    }
}