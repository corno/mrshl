import * as builders from "../../datasetAPI"
import * as md from "../../metaDataSchema"
import { RawObject } from "./generics"

/* eslint
    max-classes-per-file: "off",
*/

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export class Dictionary implements builders.Dictionary {
    private readonly definition: md.Dictionary
    private readonly entries: DictionaryEntry[] = []
    constructor(_collDef: md.Collection, definition: md.Dictionary) {
        this.definition = definition
    }
    public createEntry() {
        const de = new DictionaryEntry(this.definition)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: DictionaryEntry, key: string) => void) {
        this.entries.forEach(e => callback(e, "FIX"))
    }
}

export class List implements builders.ListBuilder {
    private readonly definition: md.List
    private readonly entries: ListEntry[] = []
    constructor(_collDef: md.Collection, definition: md.List) {
        this.definition = definition
    }
    public createEntry() {
        const de = new ListEntry(this.definition)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: ListEntry) => void) {
        this.entries.forEach(e => callback(e))
    }
}

export class Component implements builders.Component {
    private readonly definition: md.Component
    public readonly node: Node
    constructor(definition: md.Component) {
        this.definition = definition
        this.node = new Node(this.definition.type.get().node)
    }
    public setComments() {
        //
    }
}

export class ListEntry implements builders.ListEntry {
    //private readonly definition: types.Collection
    public readonly node: Node
    constructor(definition: md.List) {
        //this.definition = definition
        const nodeDefinition = ((): md.Node => {
            switch (definition["has instances"][0]) {
                case "no":
                    throw new Error("no instances expected")
                case "yes":
                    return definition["has instances"][1].node
                default:
                    return assertUnreachable(definition["has instances"][0])
            }
        })()
        this.node = new Node(nodeDefinition)
    }
    public setComments() {
        //
    }
}

export class DictionaryEntry implements builders.DictionaryEntry {
    //private readonly definition: types.Collection
    public readonly node: Node
    constructor(definition: md.Dictionary) {
        //this.definition = definition
        const nodeDefinition = ((): md.Node => {
            switch (definition["has instances"][0]) {
                case "no":
                    throw new Error("no instances expected")
                case "yes":
                    return definition["has instances"][1].node
                default:
                    return assertUnreachable(definition["has instances"][0])
            }
        })()
        this.node = new Node(nodeDefinition)
    }
    public setComments() {
        //
    }
}

export class Node implements builders.NodeBuilder {
    private readonly definition: md.Node
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
    private readonly definition: md.StateGroup
    private currentState: null | State = null
    constructor(definition: md.StateGroup) {
        this.definition = definition
    }
    public setState(stateName: string) {
        const stateDef = this.definition.states.get(stateName)
        if (stateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        //
        const state = new State(stateName, stateDef)
        this.currentState = state
        return state
    }
    public setComments() {
        //
    }
    public getCurrentState(): State {
        if (this.currentState === null) {
            throw new Error("no state set")
        }
        return this.currentState
    }
}

export class State {
    private readonly definition: md.State
    private readonly stateName: string
    public readonly node: Node
    constructor(stateName: string, definition: md.State) {
        this.definition = definition
        this.stateName = stateName
        this. node = new Node(this.definition.node)
    }
    public setComments() {
        //
    }
    public getStateKey(): string {
        return this.stateName
    }
}

export class Value implements builders.Value {
    private value: string
    public definition: md.Value
    constructor(definition: md.Value) {
        this.value = definition["default value"]
        this.definition = definition
    }
    public getSuggestions() {
        return []
    }
    public setComments() {
        //
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