/* eslint
    "max-classes-per-file": off,
    "@typescript-eslint/no-this-alias": off,
*/

import * as astncore from "astn-core"
import * as imp from "./internals"
import { Global } from "./Global"
import { initializeState } from "./internals"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

type PropertyType =
    | ["list", astncore.List]
    | ["dictionary", astncore.Dictionary]
    | ["component", astncore.Component]
    | ["state group", astncore.TaggedUnion]
    | ["value", astncore.Value]

export function createNode(
    node: imp.Node,
    definition: astncore.NodeDefinition,
    global: Global,
): astncore.Node {

    function getValue(
        valueImp: imp.Value,
        definition: astncore.SimpleStringDefinition,
    ) {

        class Value {
            public readonly comments: imp.Comments
            private readonly imp: imp.Value
            public readonly isQuoted: boolean
            public readonly definition: astncore.SimpleStringDefinition
            constructor(valueImp: imp.Value, definition: astncore.SimpleStringDefinition) {
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
        return new Value(valueImp, definition)
    }

    class Node {
        private readonly imp: imp.Node
        private readonly definition: astncore.NodeDefinition
        private readonly global: Global
        constructor(
        ) {
            this.definition = definition
            this.imp = node
            this.global = global
        }
        public getDictionary(key: string): astncore.Dictionary {
            const propDef = this.definition.properties.getUnsafe(key)
            if (propDef.type[0] !== "dictionary") {
                throw new Error("not a dicionary")
            }
            const dictDef = propDef.type[1]
            const collection = this.imp.collections.getUnsafe(key)


            function createEntry(
                entryImp: imp.Entry,
                collectionImp: imp.Collection,
            ): astncore.Entry {
                class Entry {
                    public readonly node: astncore.Node
                    public readonly comments: imp.Comments
                    public readonly key: astncore.Value
                    constructor(
                    ) {
                        this.comments = entryImp.comments
                        this.node = createNode(
                            entryImp.node,
                            collectionImp.nodeDefinition,
                            global,
                        )
                        if (entryImp.key === null) {
                            throw new Error("unexpected")
                        }
                        this.key = getValue(
                            entryImp.key,
                            dictDef.key,
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
                return new Entry()
            }
            class Dictionary {
                readonly comments: imp.Comments
                public readonly imp: imp.Collection
                private readonly definition: astncore.DictionaryDefinition
                private readonly global: Global
                constructor(
                    collectionImp: imp.Collection,
                    definition: astncore.DictionaryDefinition,
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
                public createEntry(): astncore.Entry {
                    const entryImp = imp.createEntry(
                        this.definition.node,
                        this.imp,
                        this.global
                    )
                    const entry = createEntry(entryImp, this.imp)

                    return entry
                }
                public forEachEntry(callback: (entry: astncore.Entry, key: string) => void): void {
                    this.imp.entries.forEach(e => {
                        if (e.status.get()[0] !== "inactive") {
                            if (e.entry.key === null) {
                                throw new Error("unexpected")
                            }
                            callback(
                                createEntry(
                                    e.entry,
                                    this.imp,
                                ),
                                e.entry.key.value.get()
                            )
                        }
                    })
                }
            }
            return new Dictionary(collection, propDef.type[1], this.global)
        }
        public getList(key: string): astncore.List {
            const propDef = this.definition.properties.getUnsafe(key)
            if (propDef.type[0] !== "list") {
                throw new Error("not a list")
            }
            const collection = this.imp.collections.getUnsafe(key)

            function createEntry(
                entryImp: imp.Entry,
                collectionImp: imp.Collection,
            ): astncore.Element {
                return {
                    node: createNode(
                        entryImp.node,
                        collectionImp.nodeDefinition,
                        global,
                    ),
                    comments: entryImp.comments,
                }
            }
            class List {
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
                public createEntry(): astncore.Element {
                    const entryImp = new imp.Entry(this.imp.nodeDefinition, this.global.errorManager, this.imp.dictionary)

                    const entryPlaceHolder = new imp.EntryPlaceholder(entryImp, this.imp, true)
                    const entry = createEntry(entryImp, this.imp)
                    imp.addEntry(this.imp, entryPlaceHolder)
                    return entry
                }
                public forEachEntry(callback: (entry: astncore.Element) => void): void {
                    this.imp.entries.forEach(e => {
                        if (e.status.get()[0] !== "inactive") {
                            callback(createEntry(
                                e.entry,
                                this.imp,
                            ))
                        }
                    })
                }
            }
            return new List(collection, this.global)
        }
        public getComponent(key: string): astncore.Component {
            const propDef = this.definition.properties.getUnsafe(key)
            if (propDef.type[0] !== "component") {
                throw new Error("not a component")
            }
            const component = this.imp.components.getUnsafe(key)
            function createComponent(
                definition: astncore.ComponentDefinition,
                component: imp.Component,
                global: Global,
            ): astncore.Component {
                return {
                    node: createNode(
                        component.node,
                        definition.type.get().node,
                        global,
                    ),
                    comments: component.comments,
                }
            }
            return createComponent(
                propDef.type[1],
                component,
                this.global,
            )
        }
        public getTaggedUnion(key: string): astncore.TaggedUnion {
            const propDef = this.definition.properties.getUnsafe(key)
            if (propDef.type[0] !== "tagged union") {
                throw new Error("not a tagged union")
            }
            const sg = this.imp.taggedUnions.getUnsafe(key)

            function createTaggedUnion(
                stateGroup: imp.StateGroup,
                definition: astncore.TaggedUnionDefinition,
                global: Global
            ): astncore.TaggedUnion {
                class State {
                    public readonly node: astncore.Node
                    private readonly imp: imp.State
                    constructor(stateImp: imp.State, definition: astncore.OptionDefinition, global: Global) {
                        this.node = createNode(stateImp.node, definition.node, global)
                        this.imp = stateImp
                    }
                    public getStateKey(): string {
                        return this.imp.key
                    }
                }
                class TaggedUnion {
                    public readonly comments: imp.Comments
                    public readonly definition: astncore.TaggedUnionDefinition
                    constructor() {
                        this.definition = definition
                        this.comments = stateGroup.comments
                    }
                    public setState(stateName: string, _onError: (errorMessage: string) => void): astncore.Option {
                        const stateDefinition = this.definition.options.getUnsafe(stateName)

                        const stateImp = initializeState(stateDefinition, stateGroup, stateName, global, _onError)

                        return new State(stateImp, stateDefinition, global)
                    }
                    public getCurrentState(): astncore.Option {

                        const currentStateImp = stateGroup.currentState.get()
                        const stateName = currentStateImp.key
                        const stateImp = stateGroup.currentState.get()
                        return new State(stateImp, this.definition.options.getUnsafe(stateName), global)
                    }
                }
                return new TaggedUnion()
            }

            return createTaggedUnion(sg, propDef.type[1], this.global)
        }
        public getValue(key: string): astncore.Value {
            const propDef = this.definition.properties.getUnsafe(key)
            if (propDef.type[0] !== "simple string") {
                throw new Error("not a string")
            }

            return getValue(
                this.imp.values.getUnsafe(key),
                propDef.type[1]
            )

        }
        public forEachProperty(callback: (property: astncore.Property, key: string) => void): void {

            const thisNode = this
            this.definition.properties.forEach((p, pKey) => {

                class Property {
                    public readonly type: PropertyType
                    constructor(
                        definition: astncore.PropertyDefinition,
                    ) {
                        this.type = ((): PropertyType => {
                            switch (definition.type[0]) {
                                case "component": {
                                    return ["component", thisNode.getComponent(pKey)]
                                }
                                case "dictionary": {
                                    return ["dictionary", thisNode.getDictionary(pKey)]
                                }
                                case "list": {
                                    return ["list", thisNode.getList(pKey)]
                                }
                                case "tagged union": {
                                    return ["state group", thisNode.getTaggedUnion(pKey)]
                                }
                                case "simple string": {
                                    return ["value", thisNode.getValue(pKey)]
                                }
                                case "multiline string": {
                                    throw new Error("IMPLEMENT ME: MULTILINE STRING")
                                    return ["value", thisNode.getValue(pKey)]
                                }
                                default:
                                    return assertUnreachable(definition.type[0])
                            }
                        })()
                    }
                }

                callback(
                    new Property(
                        p,
                    ),
                    pKey
                )
            })
        }
    }
    return new Node()
}