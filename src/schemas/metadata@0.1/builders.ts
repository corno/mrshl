import * as builders from "../../builderAPI"
import * as types from "../../metaDataSchema"

/* eslint
    max-classes-per-file: "off",
*/

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export class DictionaryBuilder implements builders.DictionaryBuilder {
    private readonly definition: types.Dictionary
    private readonly entries: DictionaryEntryBuilder[] = []
    constructor(definition: types.Dictionary) {
        this.definition = definition
    }
    public createEntry() {
        const de = new DictionaryEntryBuilder(this.definition)
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: DictionaryEntryBuilder) => void) {
        this.entries.forEach(e => callback(e))
    }
}

export class ListBuilder implements builders.ListBuilder {
    private readonly definition: types.List
    private readonly entries: ListEntryBuilder[] = []
    constructor(definition: types.Dictionary) {
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
    constructor(definition: types.Component) {
        this.definition = definition
    }
    public readonly node = new NodeBuilder(this.definition.type.get().node)
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
    public insert() {
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
    public insert() {
        //
    }
}

export class NodeBuilder implements builders.NodeBuilder {
    private readonly definition: types.Node
    constructor(definition: types.Node) {
        this.definition = definition
    }
    public getDefinition() {
        return this.definition
    }
    public getDictionary(_name: string) {
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
        return new DictionaryBuilder($.type[1])
    }
    public getList(_name: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "collection") {
            throw new Error(`UNEXPECTED: property '${name}' is not a collection`)
        }
        const $ = propDef.type[1]
        if ($.type[0] !== "list") {
            throw new Error(`UNEXPECTED: property '${name}' is not a dictionary`)
        }
        return new ListBuilder($.type[1])
    }
    public getComponent(_name: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "component") {
            throw new Error(`UNEXPECTED: property '${name}' is not a component`)
        }
        return new ComponentBuilder(propDef.type[1])
    }
    public getStateGroup(_name: string) {
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
    constructor(stateName: string, definition: types.State) {
        this.definition = definition
        this.stateName = stateName
    }
    public readonly node = new NodeBuilder(this.definition.node)
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
    getSuggestions() {
        return []
    }
    setComments() {
        //
    }
    setValue(value: string) {
        this.value = value
    }
    getValue(): string {
        return this.value
    }
}

export function createNodeBuilder(definition: types.Node) {
    return new NodeBuilder(definition)
}