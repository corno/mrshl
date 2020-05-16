import * as builders from "../../../datasetAPI"
import * as types from "./types"
import * as md from "../../../metaDataSchema"
import { RawObject } from "./generics"

/* eslint
    max-classes-per-file: "off",
*/

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

export class Dictionary implements builders.Dictionary {
    private readonly collectionDefinition: types.Collection
    private readonly dictionaryDefinition: types.Dictionary
    private readonly entries: DictionaryEntry[] = []
    public readonly definition: md.Dictionary
    constructor(
        collectionDefinition: types.Collection,
        dictionaryDefinition: types.Dictionary,
        publicDefinition: md.Dictionary,
    ) {
        this.collectionDefinition = collectionDefinition
        this.dictionaryDefinition = dictionaryDefinition
        this.definition = publicDefinition
    }
    public createEntry() {
        const de = new DictionaryEntry(
            this.collectionDefinition,
            this.dictionaryDefinition,
            this.definition,
        )
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: DictionaryEntry, key: string) => void) {
        this.entries.forEach(e => {
            const keyPropName = e.dictionaryDefinition["key property"].name
            callback(e, e.node.getValue(keyPropName).getValue())
        })
    }
}

export class List implements builders.List {
    private readonly collectionDefinition: types.Collection
    private readonly listDefinition: types.List
    public readonly definition: md.List
    private readonly entries: ListEntry[] = []

    constructor(
        collectionDefinition: types.Collection,
        listDefinition: types.List,
        publicDefinition: md.List,
    ) {
        this.collectionDefinition = collectionDefinition
        this.listDefinition = listDefinition
        this.definition = publicDefinition
    }
    public createEntry() {
        const de = new ListEntry(
            this.collectionDefinition,
            this.listDefinition,
            this.definition,
        )
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: ListEntry) => void) {
        this.entries.forEach(e => callback(e))
    }
}

export class Component implements builders.Component {
    public readonly definition: md.Component
    public readonly node: Node
    constructor(privateDefinition: types.Component, publicDefinition: md.Component) {
        this.definition = publicDefinition
        this.node = new Node(privateDefinition.type.get().node, publicDefinition.type.get().node)
    }
    public setComments() {
        //
    }
}

export class ListEntry implements builders.ListEntry {
    //private readonly collectionDefinition: types.Collection
    //private readonly listDefinition: types.List
    //private readonly onError: OnError
    public readonly definition: md.List
    public readonly node: Node

    constructor(
        collectionDefinition: types.Collection,
        _listDefinition: types.List,
        publicDefinition: md.List
    ) {
        //this.collectionDefinition = collectionDefinition
        //this.listDefinition = listDefinition
        //this.onError = onError
        this.definition = publicDefinition
        if (publicDefinition["has instances"][0] !== "yes") {
            throw new Error("Unexpected")
        }
        this.node = new Node(collectionDefinition.node, publicDefinition["has instances"][1].node)
    }
    public setComments() {
        //
    }
}
export class DictionaryEntry implements builders.DictionaryEntry {
    //private readonly collectionDefinition: types.Collection
    //private readonly dictionaryDefinition: types.Dictionary
    //private readonly onError: OnError
    public readonly node: Node
    public readonly dictionaryDefinition: types.Dictionary
    public readonly definition: md.Dictionary

    constructor(
        collectionDefinition: types.Collection,
        dictionaryDefinition: types.Dictionary,
        publicDefinition: md.Dictionary,
    ) {
        //this.collectionDefinition = collectionDefinition
        //this.dictionaryDefinition = dictionaryDefinition
        //this.onError = onError
        this.definition = publicDefinition
        if (publicDefinition["has instances"][0] !== "yes") {
            throw new Error("unexpected")
        }
        this.node = new Node(collectionDefinition.node, publicDefinition["has instances"][1].node)
        this.dictionaryDefinition = dictionaryDefinition
    }
    public setComments() {
        //
    }
}

export type PropertyType =
    | ["list", List]
    | ["dictionary", Dictionary]
    | ["component", Component]
    | ["state group", StateGroup]
    | ["value", Value]

export class Property implements builders.Property {
    public readonly definition: md.Property
    public readonly type: PropertyType
    public readonly isKeyProperty: boolean
    constructor(definition: md.Property, type: PropertyType, keyProperty: null | md.Property) {
        this.definition = definition
        this.type = type
        this.isKeyProperty = keyProperty === null ? false : keyProperty === definition
    }
}

export class Node implements builders.Node {
    public readonly definition: md.Node
    private readonly privateDefinition: types.Node
    private readonly dictionaries: RawObject<Dictionary> = {}
    private readonly lists: RawObject<List> = {}
    private readonly components: RawObject<Component> = {}
    private readonly stateGroups: RawObject<StateGroup> = {}
    private readonly values: RawObject<Value> = {}
    constructor(privateDefinition: types.Node, publicDefinition: md.Node) {
        this.privateDefinition = privateDefinition
        this.definition = publicDefinition
        this.privateDefinition.properties.forEach((p, pKey) => {
            const publicPropertyDefinition = publicDefinition.properties.get(pKey)
            if (publicPropertyDefinition === null) {
                throw new Error("Unexpected")
            }
            switch (p.type[0]) {
                case "collection": {
                    const $ = p.type[1]
                    if (publicPropertyDefinition.type[0] !== "collection") {
                        throw new Error("unexpected")
                    }
                    const publicCollectionDefinition = publicPropertyDefinition.type[1]

                    switch ($.type[0]) {
                        case "dictionary": {
                            if (publicCollectionDefinition.type[0] !== "dictionary") {
                                throw new Error("unexpected")
                            }
                            this.dictionaries[pKey] = new Dictionary($, $.type[1], publicCollectionDefinition.type[1])
                            break
                        }
                        case "list": {
                            if (publicCollectionDefinition.type[0] !== "list") {
                                throw new Error("unexpected")
                            }
                            this.lists[pKey] = new List($, $.type[1], publicCollectionDefinition.type[1])
                            break
                        }
                        default:
                            assertUnreachable($.type[0])
                    }
                    break
                }
                case "component": {
                    if (publicPropertyDefinition.type[0] !== "component") {
                        throw new Error("unexpected")
                    }
                    this.components[pKey] = new Component(p.type[1], publicPropertyDefinition.type[1])
                    break
                }
                case "state group": {
                    if (publicPropertyDefinition.type[0] !== "state group") {
                        throw new Error("unexpected")
                    }
                    this.stateGroups[pKey] = new StateGroup(p.type[1], publicPropertyDefinition.type[1])
                    break
                }
                case "value": {
                    if (publicPropertyDefinition.type[0] !== "value") {
                        throw new Error("unexpected")
                    }
                    this.values[pKey] = new Value(p.type[1], publicPropertyDefinition.type[1])
                    break
                }
                default:
                    assertUnreachable(p.type[0])
            }
        })
    }
    public forEachProperty(callback: (property: Property, key: string) => void) {
        this.definition.properties.forEach((p, pKey) => {
            switch (p.type[0]) {
                case "collection": {
                    const $ = p.type[1]
                    switch ($.type[0]) {
                        case "dictionary": {
                            const $$ = $.type[1]
                            switch ($$["has instances"][0]) {
                                case "no": {
                                    callback(new Property(p, ["dictionary", this.getDictionary(pKey)], null), pKey)
                                    break
                                }
                                case "yes": {
                                    const $$$ = $$["has instances"][1]
                                    callback(new Property(p, ["dictionary", this.getDictionary(pKey)], $$$["key property"].get()), pKey)
                                    break
                                }
                                default:
                                    assertUnreachable($$["has instances"][0])
                            }
                            break
                        }
                        case "list": {
                            callback(new Property(p, ["list", this.getList(pKey)], null), pKey)
                            break
                        }
                        default:
                            assertUnreachable($.type[0])
                    }
                    break
                }
                case "component": {
                    callback(new Property(p, ["component", this.getComponent(pKey)], null), pKey)
                    break
                }
                case "state group": {
                    callback(new Property(p, ["state group", this.getStateGroup(pKey)], null), pKey)
                    break
                }
                case "value": {
                    callback(new Property(p, ["value", this.getValue(pKey)], null), pKey)
                    break
                }
                default:
                    assertUnreachable(p.type[0])
            }
        })
    }
    public getDictionary(name: string) {
        const p = this.dictionaries[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such dictionary: ${name}`)
        }
        return p
    }
    public getList(name: string) {
        const p = this.lists[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such list: ${name}`)
        }
        return p
    }
    public getComponent(name: string) {
        const p = this.components[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such component: ${name}`)
        }
        return p
    }
    public getStateGroup(name: string) {
        const p = this.stateGroups[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such state group: ${name}`)
        }
        return p
    }
    public getValue(name: string) {
        const p = this.values[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such value: ${name}`)
        }
        return p
    }
}

export class Value implements builders.Value {
    private readonly privateDefinition: types.Value
    public readonly definition: md.Value
    public readonly isQuoted: boolean
    private value: string
    constructor(privateDefinition: types.Value, definition: md.Value) {
        this.privateDefinition = privateDefinition
        this.value = privateDefinition["default value"]
        this.definition = definition
        this.isQuoted = definition.quoted
    }
    public setComments() {
        //
    }
    public getSuggestions() {
        return []
    }
    public getValue(): string {
        return this.value
    }
    public setValue(value: string, onError: (message: string) => void) {
        const $ = this.privateDefinition
        switch ($.type[0]) {
            case "boolean": {
                if (value !== "true" && value !== "false") {
                    onError(`value '${value}' is not a boolean`)
                }
                break
            }
            case "number": {
                /* eslint no-new-wrappers: "off" */
                const nr = new Number(value).valueOf()
                if (isNaN(nr)) {
                    onError(`value '${value}' is not a number`)
                }
                break
            }
            case "string": {
                break
            }
            default:
                assertUnreachable($.type[0])
        }
        this.value = value
    }
}

export class StateGroup implements builders.StateGroup {
    private readonly privateDefinition: types.StateGroup
    public readonly definition: md.StateGroup
    private currentState: StateBuilder
    constructor(privateDefinition: types.StateGroup, publicDefinition: md.StateGroup) {
        this.privateDefinition = privateDefinition
        this.definition = publicDefinition
        this.currentState = new StateBuilder(
            privateDefinition["default state"].name,
            privateDefinition["default state"].get(),
            publicDefinition["default state"].get(),
        )
    }
    public setState(stateName: string) {
        const statePrivateDef = this.privateDefinition.states.get(stateName)
        const stateDef = this.definition.states.get(stateName)
        if (statePrivateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        if (stateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        const state = new StateBuilder(stateName, statePrivateDef, stateDef)
        this.currentState = state
        return state
    }
    public setComments() {
        //
    }
    public getCurrentState(): StateBuilder {
        return this.currentState
    }
}


export class StateBuilder {
    public readonly definition: md.State
    public readonly node: Node
    private readonly stateName: string
    constructor(stateName: string, privateDefinition: types.State, publicDefinition: md.State) {
        //this.onError = onError
        this.definition = publicDefinition
        this.node = new Node(privateDefinition.node, publicDefinition.node)
        this.stateName = stateName
    }
    public setComments() {
        //
    }
    public getStateKey(): string {
        return this.stateName
    }
}

export class DatasetBuilder {
    public readonly schema: md.Schema
    public readonly root: Node
    constructor(definition: types.Schema, metaDataSchema: md.Schema) {
        //this.onError = onError
        this.schema = metaDataSchema
        this.root = new Node(definition["root type"].get().node, metaDataSchema["root type"].get().node)
    }
}
