import * as builders from "../../builderAPI"
import * as types from "./types"
import { RawObject } from "./generics"

/* eslint
    max-classes-per-file: "off",
*/

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

export class DictionaryBuilder implements builders.DictionaryBuilder {
    private readonly collectionDefinition: types.Collection
    private readonly dictionaryDefinition: types.Dictionary
    private readonly entries: DictionaryEntryBuilder[] = []

    constructor(collectionDefinition: types.Collection, dictionaryDefinition: types.Dictionary) {
        this.collectionDefinition = collectionDefinition
        this.dictionaryDefinition = dictionaryDefinition
    }
    public createEntry() {
        const de = new DictionaryEntryBuilder(this.collectionDefinition, this.dictionaryDefinition)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: DictionaryEntryBuilder, key: string) => void) {
        this.entries.forEach(e => {
            const keyPropName = e.dictionaryDefinition["key property"].getName()
            callback(e, e.node.getValue(keyPropName).getValue())
        })
    }
}

export class ListBuilder implements builders.ListBuilder {
    private readonly collectionDefinition: types.Collection
    private readonly listDefinition: types.List
    private readonly entries: ListEntryBuilder[] = []

    constructor(collectionDefinition: types.Collection, listDefinition: types.List) {
        this.collectionDefinition = collectionDefinition
        this.listDefinition = listDefinition
    }
    public createEntry() {
        const de = new ListEntryBuilder(this.collectionDefinition, this.listDefinition)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: ListEntryBuilder) => void) {
        this.entries.forEach(e => callback(e))
    }
}

export class ComponentBuilder implements builders.ComponentBuilder {
    //private readonly definition: types.Component
    public readonly node: NodeBuilder
    constructor(definition: types.Component) {
        //this.definition = definition
        this.node = new NodeBuilder(definition.type.get().node)
    }
    public setComments() {
        //
    }
}

export class ListEntryBuilder implements builders.ListEntryBuilder {
    //private readonly collectionDefinition: types.Collection
    //private readonly listDefinition: types.List
    //private readonly onError: OnError
    public readonly node: NodeBuilder

    constructor(collectionDefinition: types.Collection, _listDefinition: types.List) {
        //this.collectionDefinition = collectionDefinition
        //this.listDefinition = listDefinition
        //this.onError = onError
        this.node = new NodeBuilder(collectionDefinition.node)
    }
    public setComments() {
        //
    }
}
export class DictionaryEntryBuilder implements builders.DictionaryEntryBuilder {
    //private readonly collectionDefinition: types.Collection
    //private readonly dictionaryDefinition: types.Dictionary
    //private readonly onError: OnError
    public readonly node: NodeBuilder
    public dictionaryDefinition: types.Dictionary

    constructor(collectionDefinition: types.Collection, dictionaryDefinition: types.Dictionary) {
        //this.collectionDefinition = collectionDefinition
        //this.dictionaryDefinition = dictionaryDefinition
        //this.onError = onError
        this.node = new NodeBuilder(collectionDefinition.node)
        this.dictionaryDefinition = dictionaryDefinition
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

export class ValueBuilder implements builders.ValueBuilder {
    private readonly definition: types.Value
    private value: string
    constructor(definition: types.Value) {
        this.definition = definition
        this.value = definition["default value"]
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
        const $ = this.definition
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
        const state = new StateBuilder(stateName, stateDef)
        this.currentState = state
        return state
    }
    public setComments() {
        //
    }
    public getCurrentState(): StateBuilder {
        if (this.currentState === null) {
            throw new Error("no current state")
        }
        return this.currentState
    }
}


export class StateBuilder {
    //private readonly definition: types.State
    public readonly node: NodeBuilder
    private readonly stateName: string
    constructor(stateName: string, definition: types.State) {
        //this.onError = onError
        //this.definition = definition
        this.node = new NodeBuilder(definition.node)
        this.stateName = stateName
    }
    public setComments() {
        //
    }
    public getStateKey(): string {
        return this.stateName
    }
}
