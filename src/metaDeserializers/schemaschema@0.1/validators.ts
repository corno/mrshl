import * as bc from "bass-clarinet"
import * as validators from "../../deserialize/api"
import * as types from "./types"

/* eslint
    max-classes-per-file: "off",
*/

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

type OnError = (message: string, range: bc.Range) => void

export class CollectionValidator implements validators.CollectionValidator {
    private readonly definition: types.Collection
    private readonly onError: OnError

    constructor(definition: types.Collection, onError: OnError) {
        this.definition = definition
        this.onError = onError
    }
    public createEntry() {
        return new EntryValidator(this.definition, this.onError)
    }
}

export class ComponentValidator implements validators.ComponentValidator {
    //private readonly definition: types.Component
    public readonly node: NodeValidator
    constructor(definition: types.Component, onError: OnError) {
        //this.definition = definition
        this.node = new NodeValidator(definition.type.get().node, onError)
    }
}

export class EntryValidator implements validators.EntryValidator {
    //private readonly definition: types.Collection
    //private readonly onError: OnError
    public readonly node: NodeValidator
    constructor(definition: types.Collection, onError: OnError) {
        //this.definition = definition
        //this.onError = onError
        this.node = new NodeValidator(definition.node, onError)
    }
    public insert() {
        //
    }
}

export class NodeValidator implements validators.NodeValidator {
    private readonly definition: types.Node
    private readonly onError: OnError
    constructor(definition: types.Node, onError: OnError) {
        this.definition = definition
        this.onError = onError
    }
    public setCollection(name: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "collection") {
            throw new Error(`UNEXPECTED: property '${name}' is not a collection`)
        }
        return new CollectionValidator(propDef.type[1], this.onError)
    }
    public setComponent(name: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "component") {
            throw new Error(`UNEXPECTED: property '${name}' is not a component`)
        }
        return new ComponentValidator(propDef.type[1], this.onError)
    }
    public setStateGroup(name: string, stateName: string) {
        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "state group") {
            throw new Error(`UNEXPECTED: property '${name}' is not a state group`)
        }
        const stateDef = propDef.type[1].states.get(stateName)
        if (stateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        return new StateValidator(stateDef, this.onError)
    }
    public setSimpleValue(name: string, value: string, quoted: boolean, range: bc.Range) {

        const propDef = this.definition.properties.get(name)
        if (propDef === null) {
            throw new Error(`UNEXPECTED: no such property: ${name}`)
        }
        if (propDef.type[0] !== "value") {
            throw new Error(`UNEXPECTED: property '${name}' is not a value`)
        }
        const $ = propDef.type[1]
        switch ($.type[0]) {
            case "boolean": {
                if (quoted) {
                    this.onError(`value '${value}' is not a boolean but a string`, range)
                }
                if (value !== "true" && value !== "false") {
                    this.onError(`value '${value}' is not a boolean`, range)
                }
                break
            }
            case "number": {
                if (quoted) {
                    this.onError(`value '${value}' is not a number but a string`, range)
                }
                /* eslint no-new-wrappers: "off" */
                const nr = new Number(value).valueOf()
                if (isNaN(nr)) {
                    this.onError(`value '${value}' is not a number`, range)
                }
                break
            }
            case "string": {
                if (!quoted) {
                    this.onError(`value '${value}' is not quoted`, range)
                }
                break
            }
            default:
                return assertUnreachable($.type[0])
        }
    }
}

export class StateValidator {
    //private readonly definition: types.State
    //private readonly onError: OnError
    public readonly node: NodeValidator
    constructor(definition: types.State, onError: OnError) {
        //this.onError = onError
        //this.definition = definition
        this.node = new NodeValidator(definition.node, onError)
    }
}
