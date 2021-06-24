/* eslint
    "max-classes-per-file": off,
*/

import * as buildAPI from "../../../deserialize/interfaces/buildAPI"
import * as def from "../../../deserialize/interfaces/typedParserDefinitions"
import * as imp from "./internals"
import { Global } from "./Global"
import { initializeNode } from "./initializeNode"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

class Component implements buildAPI.Component {
    public node: Node
    public readonly comments: imp.Comments
    constructor(
        definition: def.ComponentDefinition,
        component: imp.Component,
        global: Global,
        keyProperty: def.PropertyDefinition | null,
    ) {
        this.node = new Node(
            component.node,
            definition.type.get().node,
            global,
            keyProperty,
        )
        this.comments = component.comments
    }
}

type PropertyType =
    | ["list", List]
    | ["dictionary", Dictionary]
    | ["component", Component]
    | ["state group", TaggedUnion]
    | ["value", Value]

class Property implements buildAPI.Property {
    public readonly type: PropertyType
    public readonly isKeyProperty: boolean
    constructor(
        propertyKey: string,
        definition: def.PropertyDefinition,
        nodeImp: imp.Node,
        global: Global,
        keyProperty: def.PropertyDefinition | null,
    ) {
        this.type = ((): PropertyType => {
            switch (definition.type[0]) {
                case "component": {
                    const $ = definition.type[1]
                    return ["component", new Component(
                        $,
                        nodeImp.components.getUnsafe(propertyKey),
                        global,
                        keyProperty,
                    )]
                }
                case "dictionary": {
                    const $$ = definition.type[1]
                    return ["dictionary", new Dictionary(
                        nodeImp.collections.getUnsafe(propertyKey),
                        $$,
                        global,
                    )]

                }
                case "list": {
                    //const $$ = $.type[1]
                    return ["list", new List(
                        nodeImp.collections.getUnsafe(propertyKey),
                        //$$,
                        global,
                    )]

                }
                case "tagged union": {
                    const $ = definition.type[1]
                    return ["state group", new TaggedUnion(
                        nodeImp.taggedUnions.getUnsafe(propertyKey),
                        $,
                        global,
                    )]
                }
                case "string": {
                    const $ = definition.type[1]
                    return ["value", new Value(
                        nodeImp.values.getUnsafe(propertyKey),
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

export class Node implements buildAPI.Node {
    private readonly imp: imp.Node
    private readonly definition: def.NodeDefinition
    private readonly global: Global
    private readonly keyProperty: def.PropertyDefinition | null
    constructor(
        node: imp.Node,
        definition: def.NodeDefinition,
        global: Global,
        keyProperty: def.PropertyDefinition | null,
    ) {
        this.definition = definition
        this.imp = node
        this.global = global
        this.keyProperty = keyProperty
    }
    public getDictionary(key: string): Dictionary {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "dictionary") {
            throw new Error("not a dicionary")
        }
        const collection = this.imp.collections.getUnsafe(key)
        return new Dictionary(collection, propDef.type[1], this.global)
    }
    public getList(key: string): List {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "list") {
            throw new Error("not a list")
        }
        const collection = this.imp.collections.getUnsafe(key)
        return new List(collection, this.global)
    }
    public getComponent(key: string): Component {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "component") {
            throw new Error("not a component")
        }
        const component = this.imp.components.getUnsafe(key)
        return new Component(
            propDef.type[1],
            component,
            this.global,
            this.keyProperty,
        )
    }
    public getTaggedUnion(key: string): TaggedUnion {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "tagged union") {
            throw new Error("not a tagged union")
        }
        const sg = this.imp.taggedUnions.getUnsafe(key)

        return new TaggedUnion(sg, propDef.type[1], this.global)
    }
    public getValue(key: string): Value {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "string") {
            throw new Error("not a string")
        }
        return new Value(this.imp.values.getUnsafe(key), propDef.type[1])
    }
    public forEachProperty(callback: (property: Property, key: string) => void): void {
        this.definition.properties.forEach((p, pKey) => {
            callback(
                new Property(
                    pKey,
                    p,
                    this.imp,
                    this.global,
                    this.keyProperty,
                ),
                pKey
            )
        })
    }
}


class TaggedUnion implements buildAPI.TaggedUnion {
    private readonly imp: imp.StateGroup
    public readonly comments: imp.Comments
    private readonly global: Global
    public readonly definition: def.TaggedUnionDefinition
    constructor(stateGroup: imp.StateGroup, definition: def.TaggedUnionDefinition, global: Global) {
        this.imp = stateGroup
        this.global = global
        this.definition = definition
        this.comments = stateGroup.comments
    }
    public setState(stateName: string, _onError: (errorMessage: string) => void): State {

        const stateDefinition = this.definition.options.getUnsafe(stateName)
        const stateImp = new imp.State(
            stateName,
            (stateNode, errorsAggregator, subEntriesErrorsAggregator) => {
                initializeNode(
                    stateNode,
                    stateDefinition.node,
                    this.global.errorManager,
                    errorsAggregator,
                    subEntriesErrorsAggregator,
                    false,
                )
            }
        )
        imp.setState(this.imp, stateImp)
        //FIXME call onError
        return new State(stateImp, stateDefinition, this.global)
    }
    public getCurrentState(): State {
        const currentStateImp = this.imp.currentState.get()
        const stateName = currentStateImp.key
        const stateImp = this.imp.currentState.get()
        return new State(stateImp, this.definition.options.getUnsafe(stateName), this.global)
    }
}

class State implements buildAPI.Option {
    public readonly node: Node
    private readonly imp: imp.State
    constructor(stateImp: imp.State, definition: def.OptionDefinition, global: Global) {
        this.node = new Node(stateImp.node, definition.node, global, null)
        this.imp = stateImp
    }
    public getStateKey(): string {
        return this.imp.key
    }
}

export class Entry implements buildAPI.Entry {
    public readonly node: Node
    public readonly comments: imp.Comments
    constructor(
        entryImp: imp.Entry,
        collectionImp: imp.Collection,
        global: Global,
    ) {
        this.comments = entryImp.comments
        this.node = new Node(
            entryImp.node,
            collectionImp.nodeDefinition,
            global,
            collectionImp.dictionary === null ? null : collectionImp.dictionary.keyProperty,
        )
    }
    // public insert() {
    //     const entryPlaceHolder = new imp.EntryPlaceholder(
    //         this.entry,
    //         this.collection,
    //         false //Not sure if this is always false
    //     )

    //     entryPlaceHolder.entry.errorsAggregator.attach(entryPlaceHolder.parent.errorsAggregator)
    //     entryPlaceHolder.entry.subentriesErrorsAggregator.attach(entryPlaceHolder.parent.errorsAggregator)
    //     this.collection.entries.addEntry(entryPlaceHolder)
    // }
}

class Dictionary implements buildAPI.Dictionary {
    readonly comments: imp.Comments
    public readonly imp: imp.Collection
    private readonly definition: def.DictionaryDefinition
    private readonly global: Global
    constructor(
        collectionImp: imp.Collection,
        definition: def.DictionaryDefinition,
        global: Global,
    ) {
        this.imp = collectionImp
        this.definition = definition
        this.global = global
        this.comments = collectionImp.comments
    }
    public isEmpty(): boolean {
        return this.imp.entries.isEmpty()
    }
    public createEntry(): Entry {
        const entryImp = new imp.Entry(
            this.imp.nodeDefinition,
            this.global.errorManager,
            this.imp.dictionary
        )
        const entryPlaceHolder = new imp.EntryPlaceholder(entryImp, this.imp, true)
        const entry = new Entry(entryImp, this.imp, this.global)
        imp.addEntry(this.imp, entryPlaceHolder)
        return entry
    }
    public forEachEntry(callback: (entry: Entry, key: string) => void): void {
        const keyPropertyName = this.definition["key property"].name
        this.imp.entries.forEach(e => {
            if (e.status.get()[0] !== "inactive") {
                callback(
                    new Entry(
                        e.entry,
                        this.imp,
                        this.global,
                    ),
                    e.entry.node.values.getUnsafe(keyPropertyName).value.get()
                )
            }
        })
    }
}


class List implements buildAPI.List {
    readonly comments: imp.Comments

    private readonly imp: imp.Collection
    //private readonly definition: d.List
    private readonly global: Global
    constructor(
        collectionImp: imp.Collection,
        global: Global,
    ) {
        this.imp = collectionImp
        this.global = global
        this.comments = collectionImp.comments

    }
    public isEmpty(): boolean {
        return this.imp.entries.isEmpty()
    }
    public createEntry(): Entry {
        const entryImp = new imp.Entry(this.imp.nodeDefinition, this.global.errorManager, this.imp.dictionary)

        const entryPlaceHolder = new imp.EntryPlaceholder(entryImp, this.imp, true)
        const entry = new Entry(entryImp, this.imp, this.global)
        imp.addEntry(this.imp, entryPlaceHolder)
        return entry
    }
    public forEachEntry(callback: (entry: Entry) => void): void {
        this.imp.entries.forEach(e => {
            if (e.status.get()[0] !== "inactive") {
                callback(new Entry(
                    e.entry,
                    this.imp,
                    this.global,
                ))
            }
        })
    }
}

class Value implements buildAPI.Value {
    public readonly comments: imp.Comments
    private readonly imp: imp.Value
    public readonly isQuoted: boolean
    public readonly definition: def.StringValueDefinition
    constructor(valueImp: imp.Value, definition: def.StringValueDefinition) {
        this.imp = valueImp
        this.comments = valueImp.comments
        this.isQuoted = definition.quoted
        this.definition = definition
    }
    public setValue(value: string, _onError: (message: string) => void): void {
        imp.setValue(this.imp, this.imp.value.get(), value)
        //FIXME handle onError
    }
    public getValue(): string {
        return this.imp.value.get()
    }
    public getSuggestions(): string[] {
        return [this.definition["default value"]]
    }
}