import * as builders from "../../builderAPI"
import * as types from "../../metaDataSchema"
import { RawObject } from "./generics"

/* eslint
    max-classes-per-file: "off",
*/

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export class DictionaryBuilder implements builders.DictionaryBuilder {
    private readonly definition: types.Dictionary
    private readonly entries: DictionaryEntryBuilder[] = []
    constructor(_collDef: types.Collection, definition: types.Dictionary) {
        this.definition = definition
    }
    public createEntry() {
        const de = new DictionaryEntryBuilder(this.definition)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: DictionaryEntryBuilder, key: string) => void) {
        this.entries.forEach(e => callback(e, "FIX"))
    }
}

export class ListBuilder implements builders.ListBuilder {
    private readonly definition: types.List
    private readonly entries: ListEntryBuilder[] = []
    constructor(_collDef: types.Collection, definition: types.Dictionary) {
        this.definition = definition
    }
    public createEntry() {
        const de = new ListEntryBuilder(this.definition)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: ListEntryBuilder) => void) {
        this.entries.forEach(e => callback(e))
    }
}

export class ComponentBuilder implements builders.ComponentBuilder {
    private readonly definition: types.Component
    public readonly node: NodeBuilder
    constructor(definition: types.Component) {
        this.definition = definition
        this.node = new NodeBuilder(this.definition.type.get().node)
    }
    public setComments() {
        //
    }
}

export class ListEntryBuilder implements builders.ListEntryBuilder {
    //private readonly definition: types.Collection
    public readonly node: NodeBuilder
    constructor(definition: types.List) {
        //this.definition = definition
        const nodeDefinition = ((): types.Node => {
            switch (definition["has instances"][0]) {
                case "no":
                    throw new Error("no instances expected")
                case "yes":
                    return definition["has instances"][1].node
                default:
                    return assertUnreachable(definition["has instances"][0])
            }
        })()
        this.node = new NodeBuilder(nodeDefinition)
    }
    public setComments() {
        //
    }
}

export class DictionaryEntryBuilder implements builders.DictionaryEntryBuilder {
    //private readonly definition: types.Collection
    public readonly node: NodeBuilder
    constructor(definition: types.Dictionary) {
        //this.definition = definition
        const nodeDefinition = ((): types.Node => {
            switch (definition["has instances"][0]) {
                case "no":
                    throw new Error("no instances expected")
                case "yes":
                    return definition["has instances"][1].node
                default:
                    return assertUnreachable(definition["has instances"][0])
            }
        })()
        this.node = new NodeBuilder(nodeDefinition)
    }
    public setComments() {
        //
    }
}

export class NodeBuilder implements builders.NodeBuilder {
    private readonly definition: types.Node
    private readonly dictionaries: RawObject<DictionaryBuilder> = {}
    private readonly lists: RawObject<ListBuilder> = {}
    private readonly components: RawObject<ComponentBuilder> = {}
    private readonly stateGroups: RawObject<StateGroupBuilder> = {}
    private readonly values: RawObject<ValueBuilder> = {}
    constructor(definition: types.Node) {
        this.definition = definition
        this.definition.properties.forEach((p, pKey) => {
            switch (p.type[0]) {
                case "collection": {
                    const $ = p.type[1]
                    switch ($.type[0]) {
                        case "dictionary": {
                            this.dictionaries[pKey] = new DictionaryBuilder($, $.type[1])
                            break
                        }
                        case "list": {
                            this.lists[pKey] = new ListBuilder($, $.type[1])
                            break
                        }
                        default:
                            assertUnreachable($.type[0])
                    }
                    break
                }
                case "component": {
                    this.components[pKey] = new ComponentBuilder(p.type[1])
                    break
                }
                case "state group": {
                    this.stateGroups[pKey] = new StateGroupBuilder(p.type[1])
                    break
                }
                case "value": {
                    this.values[pKey] = new ValueBuilder(p.type[1])
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

export class StateGroupBuilder {
    private readonly definition: types.StateGroup
    private currentState: null | StateBuilder = null
    constructor(definition: types.StateGroup) {
        this.definition = definition
    }
    public setState(stateName: string) {
        const stateDef = this.definition.states.get(stateName)
        if (stateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        //
        const state = new StateBuilder(stateName, stateDef)
        this.currentState = state
        return state
    }
    public setComments() {
        //
    }
    public getCurrentState(): StateBuilder {
        if (this.currentState === null) {
            throw new Error("no state set")
        }
        return this.currentState
    }
}

export class StateBuilder {
    private readonly definition: types.State
    private readonly stateName: string
    public readonly node: NodeBuilder
    constructor(stateName: string, definition: types.State) {
        this.definition = definition
        this.stateName = stateName
        this. node = new NodeBuilder(this.definition.node)
    }
    public setComments() {
        //
    }
    public getStateKey(): string {
        return this.stateName
    }
}

export class ValueBuilder implements builders.ValueBuilder {
    private value: string
    constructor(definition: types.Value) {
        this.value = definition["default value"]
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

export function createNodeBuilder(definition: types.Node) {
    return new NodeBuilder(definition)
}