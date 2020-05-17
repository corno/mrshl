import * as syncAPI from "./syncAPI"
import * as md from "./metaDataSchema"
import { RawObject } from "./generics"

/* eslint
    max-classes-per-file: "off",
*/

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export class Dictionary implements syncAPI.Dictionary {
    public readonly definition: md.Dictionary
    public readonly collDef: md.Collection
    private readonly entries: DictionaryEntry[] = []
    constructor(collDef: md.Collection, definition: md.Dictionary) {
        this.definition = definition
        this.collDef = collDef
    }
    public createEntry() {
        const de = new DictionaryEntry(this.definition, this.collDef)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: DictionaryEntry, key: string) => void) {
        this.entries.forEach(e => callback(e, "FIX"))
    }
}

export class List implements syncAPI.List {
    public readonly definition: md.List
    public readonly collDef: md.Collection
    private readonly entries: ListEntry[] = []
    constructor(collDef: md.Collection, definition: md.List) {
        this.definition = definition
        this.collDef = collDef
    }
    public createEntry() {
        const de = new ListEntry(this.definition, this.collDef)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: ListEntry) => void) {
        this.entries.forEach(e => callback(e))
    }
}

export class Comments implements syncAPI.Comments {
    public setComments() {
        //
    }
}

export class Component implements syncAPI.Component {
    public readonly definition: md.Component
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(definition: md.Component) {
        this.definition = definition
        this.node = new Node(this.definition.type.get().node)
    }
}

export class ListEntry {
    public readonly definition: md.List
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(definition: md.List, _collectionDefinition: md.Collection) {
        this.definition = definition
        this.node = new Node(definition.node)
    }
}

export class DictionaryEntry {
    public readonly definition: md.Dictionary
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(definition: md.Dictionary, _collDef: md.Collection) {
        this.definition = definition
        this.node = new Node(definition.node)
    }
}

export type PropertyType =
    | ["list", List]
    | ["dictionary", Dictionary]
    | ["component", Component]
    | ["state group", StateGroup]
    | ["value", Value]

export class Property implements syncAPI.Property {
    public readonly definition: md.Property
    public readonly type: PropertyType
    public readonly isKeyProperty: boolean
    constructor(definition: md.Property, type: PropertyType, keyProperty: null | md.Property) {
        this.definition = definition
        this.type = type
        this.isKeyProperty = keyProperty === null ? false : keyProperty === definition
    }
}

export class Node implements syncAPI.Node {
    public readonly definition: md.Node
    private readonly dictionaries: RawObject<Dictionary> = {}
    private readonly lists: RawObject<List> = {}
    private readonly components: RawObject<Component> = {}
    private readonly stateGroups: RawObject<StateGroup> = {}
    private readonly values: RawObject<Value> = {}
    constructor(definition: md.Node) {
        this.definition = definition
        this.definition.properties.forEach((p, pKey) => {
            switch (p.type[0]) {
                case "collection": {
                    const $ = p.type[1]
                    switch ($.type[0]) {
                        case "dictionary": {
                            this.dictionaries[pKey] = new Dictionary($, $.type[1])
                            break
                        }
                        case "list": {
                            this.lists[pKey] = new List($, $.type[1])
                            break
                        }
                        default:
                            assertUnreachable($.type[0])
                    }
                    break
                }
                case "component": {
                    this.components[pKey] = new Component(p.type[1])
                    break
                }
                case "state group": {
                    this.stateGroups[pKey] = new StateGroup(p.type[1])
                    break
                }
                case "value": {
                    this.values[pKey] = new Value(p.type[1])
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
                            callback(new Property(p, ["dictionary", this.getDictionary(pKey)], $$["key property"].get()), pKey)
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

export class StateGroup {
    public readonly definition: md.StateGroup
    private currentState: State
    public readonly comments = new Comments()
    constructor(definition: md.StateGroup) {
        this.definition = definition
        this.currentState = new State(definition["default state"].name, definition["default state"].get())
    }
    public setState(stateName: string) {
        const stateDef = this.definition.states.getUnsafe(stateName)
        if (stateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        //
        const state = new State(stateName, stateDef)
        this.currentState = state
        return state
    }
    public getCurrentState(): State {
        return this.currentState
    }
}

export class State {
    public readonly definition: md.State
    private readonly stateName: string
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(stateName: string, definition: md.State) {
        this.definition = definition
        this.stateName = stateName
        this. node = new Node(this.definition.node)
    }
    public getStateKey(): string {
        return this.stateName
    }
}

export class Value implements syncAPI.Value {
    private value: string
    public readonly definition: md.Value
    public readonly isQuoted: boolean
    public readonly comments = new Comments()
    constructor(definition: md.Value) {
        this.value = definition["default value"]
        this.definition = definition
        this.isQuoted = definition.quoted
    }
    public getSuggestions() {
        return []
    }
    public setValue(value: string) {
        this.value = value
    }
    public getValue(): string {
        return this.value
    }
}

export class Dataset {
    public readonly schema: md.Schema
    public readonly root: Node
    constructor(definition: md.Schema) {
        this.schema = definition
        this.root = new Node(definition["root type"].get().node)
    }
}

export function createDataset(definition: md.Schema) {
    return new Dataset(definition)
}