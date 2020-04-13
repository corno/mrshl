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
    constructor(definition: types.Dictionary) {
        this.definition = definition
    }
    public createEntry() {
        return new DictionaryEntryBuilder(this.definition)
    }
}

export class ListBuilder implements builders.ListBuilder {
    private readonly definition: types.List
    constructor(definition: types.Dictionary) {
        this.definition = definition
    }
    public createEntry() {
        return new ListEntryBuilder(this.definition)
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
    public getValue(_name: string) {
        return new ValueBuilder()

    }
}

export class StateGroupBuilder {
    private readonly definition: types.StateGroup
    constructor(definition: types.StateGroup) {
        this.definition = definition
    }
    public setState(stateName: string) {
        const stateDef = this.definition.states.get(stateName)
        if (stateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        //
        return new StateBuilder(stateDef)
    }
    setComments() {
        //
    }
}

export class StateBuilder {
    private readonly definition: types.State
    constructor(definition: types.State) {
        this.definition = definition
    }
    public readonly node = new NodeBuilder(this.definition.node)
    setComments() {
        //
    }
}

export class ValueBuilder implements builders.ValueBuilder {
    getSuggestions() {
        return []
    }
    setComments() {
        //
    }
    setValue() {
        //
    }
}

export function createNodeBuilder(definition: types.Node) {
    return new NodeBuilder(definition)
}