/* eslint
    "max-classes-per-file": off,
*/

import * as astn from "astn"
import * as t from "./types"
import * as syncAPI from "../../../API/syncAPI"
import * as sideEffects from "../../../API/ParsingSideEffectsAPI"
import * as md from "../../../API/types"
import { DiagnosticSeverity } from "../../../API/DiagnosticSeverity"

export * from "./types"

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

class Dictionary implements sideEffects.Dictionary {
    private readonly collectionDefinition: t.Collection
    //private readonly definition: t.Dictionary
    private readonly onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void
    constructor(
        _definition: t.Dictionary,
        collectionDefinition: t.Collection,
        onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void,
    ) {
        //this.definition = definition
        this.collectionDefinition = collectionDefinition
        this.onError = onError
    }
    onClose() {
        //
    }
    onUnexpectedEntry() {
        //
    }
    onEntry() {
        return new Node(this.collectionDefinition.node, this.onError)
    }
}

class List implements sideEffects.List {
    private readonly collectionDefinition: t.Collection
    //private readonly definition: t.List
    private readonly onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void

    constructor(
        _definition: t.List,
        collectionDefinition: t.Collection,
        onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void,
    ) {
        //this.definition = definition
        this.collectionDefinition = collectionDefinition
        this.onError = onError
    }
    onUnexpectedEntry() {
        //
    }
    onEntry() {
        return new Node(this.collectionDefinition.node, this.onError)
    }
    onClose() {
        //
    }
}

export class Root implements sideEffects.Root {
    public readonly node: Node
    constructor(
        schema: t.Schema,
        onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void
    ) {
        this.node = new Node(schema["root type"].get().node, onError)
    }
    public onEnd(): void {
        //
    }
}

class StateGroup implements sideEffects.StateGroup {
    public readonly definition: t.StateGroup
    private readonly onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void

    constructor(
        definition: t.StateGroup,
        onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void,
    ) {
        this.definition = definition
        this.onError = onError
    }
    onState(stateName: string) {
        const state = this.definition.states.getUnsafe(stateName)
        return new Node(state.node, this.onError)
    }
    onUnexpectedState() {
        //
    }
}

class Prop implements sideEffects.Property {
    public readonly nodedefinition: t.Node
    public readonly name: string
    private readonly onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void

    constructor(
        name: string,
        nodedefinition: t.Node,
        onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void,
    ) {
        this.name = name
        this.nodedefinition = nodedefinition
        this.onError = onError
    }
    onDictionary() {
        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "collection") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        if ($.type[0] !== "dictionary") {
            throw new Error("unexpected")
        }
        return new Dictionary($.type[1], $, this.onError)
    }
    onList() {
        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "collection") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        if ($.type[0] !== "list") {
            throw new Error("unexpected")
        }
        return new List($.type[1], $, this.onError)
    }
    onStateGroup() {

        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "state group") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        return new StateGroup($, this.onError)
    }
    onComponent() {
        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "component") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        return new Node($.type.get().node, this.onError)
    }
    onNull() {
        //
    }
    onValue(
        value: syncAPI.Value,
        range: astn.Range,
        data: astn.SimpleValueData,
        _definition: md.Value
    ) {
        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "value") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]

        const val = value.getValue()
        switch ($.type[0]) {
            case "boolean": {
                if (data.quote !== null) {
                    this.onError(`expected a boolean, found a quoted string`, range, DiagnosticSeverity.error)
                } else {
                    if (val !== "true" && val !== "false") {
                        this.onError(`value '${val}' is not a boolean`, range, DiagnosticSeverity.error)
                    }
                }
                break
            }
            case "number": {
                if (data.quote !== null) {
                    this.onError(`expected a number, found a quoted string`, range, DiagnosticSeverity.error)
                } else {
                    //eslint-disable-next-line no-new-wrappers
                    if (isNaN(new Number(val).valueOf())) {
                        this.onError(`value '${val}' is not a number`, range, DiagnosticSeverity.error)
                    }
                }
                break
            }
            case "string": {
                if (data.quote === null) {
                    this.onError(`expected a quoted string`, range, DiagnosticSeverity.error)
                }
                break
            }
            default:
                assertUnreachable($.type[0])
        }
    }
}

class ShorthandType implements sideEffects.ShorthandType {
    public readonly definition: t.Node
    private readonly onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void

    constructor(
        definition: t.Node,
        onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void,
    ) {
        this.definition = definition
        this.onError = onError
    }
    onProperty(key: string) {
        return new Prop(key, this.definition, this.onError)
    }
    onShorthandTypeClose() {
        //
    }
}

class Node implements sideEffects.Node {
    public readonly definition: t.Node
    private readonly onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void

    constructor(
        definition: t.Node,
        onError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void,
    ) {
        this.definition = definition
        this.onError = onError
    }
    onShorthandTypeOpen() {
        return new ShorthandType(this.definition, this.onError)
    }
    onProperty(key: string) {
        return new Prop(key, this.definition, this.onError)
    }
    onUnexpectedProperty() {
        //
    }
    onTypeOpen() {
        return new Node(this.definition, this.onError)
    }
    onTypeClose() {
        //
    }
}
