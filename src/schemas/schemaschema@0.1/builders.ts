import * as builders from "../../builderAPI"
import * as types from "./types"

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
    public forEachEntry(callback: (entry: DictionaryEntryBuilder) => void) {
        this.entries.forEach(e => callback(e))
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
    public insert() {
        //
    }
}
export class DictionaryEntryBuilder implements builders.DictionaryEntryBuilder {
    //private readonly collectionDefinition: types.Collection
    //private readonly dictionaryDefinition: types.Dictionary
    //private readonly onError: OnError
    public readonly node: NodeBuilder

    constructor(collectionDefinition: types.Collection, _dictionaryDefinition: types.Dictionary) {
        //this.collectionDefinition = collectionDefinition
        //this.dictionaryDefinition = dictionaryDefinition
        //this.onError = onError
        this.node = new NodeBuilder(collectionDefinition.node)
    }
    public insert() {
        //
    }
}

export class NodeBuilder implements builders.NodeBuilder {
    private readonly definition: types.Node
    constructor(definition: types.Node) {
        this.definition = definition
    }
    public getDictionary(name: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "collection") {
            throw new Error(`UNEXPECTED: property '${name}' is not a collection`)
        }
        const $ = propDef.type[1]
        if ($.type[0] !== "dictionary") {
            throw new Error(`UNEXPECTED: property '${name}' is not a dictionary`)
        }
        return new DictionaryBuilder(propDef.type[1], $.type[1])
    }
    public getList(name: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "collection") {
            throw new Error(`UNEXPECTED: property '${name}' is not a collection`)
        }
        const $ = propDef.type[1]
        if ($.type[0] !== "list") {
            throw new Error(`UNEXPECTED: property '${name}' is not a list`)
        }
        return new ListBuilder(propDef.type[1], $.type[1])
    }
    public getComponent(name: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "component") {
            throw new Error(`UNEXPECTED: property '${name}' is not a component`)
        }
        return new ComponentBuilder(propDef.type[1])
    }
    public getStateGroup(name: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "state group") {
            throw new Error(`UNEXPECTED: property '${name}' is not a state group`)
        }
        return new StateGroupBuilder(propDef.type[1])
    }
    public getValue(name: string) {

        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "value") {
            throw new Error(`UNEXPECTED: property '${name}' is not a value`)
        }
        return new ValueBuilder(propDef.type[1])
    }
}

export class ValueBuilder implements builders.ValueBuilder {
    private readonly definition: types.Value
    private value:string
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
