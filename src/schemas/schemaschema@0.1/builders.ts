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

    constructor(collectionDefinition: types.Collection, dictionaryDefinition: types.Dictionary) {
        this.collectionDefinition = collectionDefinition
        this.dictionaryDefinition = dictionaryDefinition
    }
    public createEntry(_onError: (message: string) => void) {
        return new DictionaryEntryBuilder(this.collectionDefinition, this.dictionaryDefinition)
    }
}

export class ListBuilder implements builders.ListBuilder {
    private readonly collectionDefinition: types.Collection
    private readonly listDefinition: types.List

    constructor(collectionDefinition: types.Collection, listDefinition: types.List) {
        this.collectionDefinition = collectionDefinition
        this.listDefinition = listDefinition
    }
    public createEntry(_onError: (message: string) => void) {
        return new ListEntryBuilder(this.collectionDefinition, this.listDefinition)
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
    constructor(definition: types.Value) {
        this.definition = definition
    }
    public setComments() {
        //
    }
    public getSuggestions() {
        return []
    }
    //public setValue(value: string, quoted: boolean, range: bc.Range) {
    public setValue(value: string, onError: (message: string) => void ) {
        const $ = this.definition
        switch ($.type[0]) {
            case "boolean": {
                // if (quoted) {
                //     this.onError(`value '${value}' is not a boolean but a string`, range)
                // }
                if (value !== "true" && value !== "false") {
                    onError(`value '${value}' is not a boolean`)
                }
                break
            }
            case "number": {
                // if (quoted) {
                //     this.onError(`value '${value}' is not a number but a string`, range)
                // }
                /* eslint no-new-wrappers: "off" */
                const nr = new Number(value).valueOf()
                if (isNaN(nr)) {
                    onError(`value '${value}' is not a number`)
                }
                break
            }
            case "string": {
                // if (!quoted) {
                //     this.onError(`value '${value}' is not quoted`, range)
                // }
                break
            }
            default:
                assertUnreachable($.type[0])
        }
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
        return new StateBuilder(stateDef)
    }
    public setComments() {
        //
    }
}


export class StateBuilder {
    //private readonly definition: types.State
    public readonly node: NodeBuilder
    constructor(definition: types.State) {
        //this.onError = onError
        //this.definition = definition
        this.node = new NodeBuilder(definition.node)
    }
    public setComments() {
        //
    }
}
