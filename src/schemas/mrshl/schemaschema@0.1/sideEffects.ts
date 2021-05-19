import * as bc from "bass-clarinet"
import * as t from "./types"
import * as syncAPI from "../../../syncAPI"
import * as sideEffects from "../../../ParsingSideEffectsAPI"
import * as md from "../../../types"
import { DiagnosticSeverity } from "../../../loadDocument"

export * from "./types"

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

class Dictionary implements sideEffects.Dictionary {
    private readonly collectionDefinition: t.Collection
    //private readonly definition: t.Dictionary
    private readonly onError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void
    constructor(
        _definition: t.Dictionary,
        collectionDefinition: t.Collection,
        onError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void,
    ) {
        //this.definition = definition
        this.collectionDefinition = collectionDefinition
        this.onError = onError
    }
    onDictionaryClose() {
        //
    }
    onUnexpectedDictionaryEntry() {
        //
    }
    onDictionaryEntry() {
        return new Node(this.collectionDefinition.node, this.onError)
    }
}

class List implements sideEffects.List {
    private readonly collectionDefinition: t.Collection
    //private readonly definition: t.List
    private readonly onError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void

    constructor(
        _definition: t.List,
        collectionDefinition: t.Collection,
        onError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void,
    ) {
        //this.definition = definition
        this.collectionDefinition = collectionDefinition
        this.onError = onError
    }
    onUnexpectedListEntry() {
        //
    }
    onListEntry() {
        return new Node(this.collectionDefinition.node, this.onError)
    }
    onListClose() {
        //
    }
}

export class Root implements sideEffects.Root {
    public readonly node: Node
    constructor(
        schema: t.Schema,
        onError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void
    ) {
        this.node = new Node(schema["root type"].get().node, onError)
    }
    public onEnd(): void {
        //
    }
}

class Node implements sideEffects.Node {
    private readonly definition: t.Node
    private readonly onError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void

    constructor(
        definition: t.Node,
        onError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void,
    ) {
        this.definition = definition
        this.onError = onError
    }
    onArrayTypeClose() {
        //
    }
    onArrayTypeOpen() {
        throw new Error("IMPLEMENT ME")
    }
    onDictionaryOpen(name: string) {
        const prop = this.definition.properties.getUnsafe(name)
        if (prop.type[0] !== "collection") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        if ($.type[0] !== "dictionary") {
            throw new Error("unexpected")
        }
        return new Dictionary($.type[1], $, this.onError)
    }
    onListOpen(name: string) {
        const prop = this.definition.properties.getUnsafe(name)
        if (prop.type[0] !== "collection") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        if ($.type[0] !== "list") {
            throw new Error("unexpected")
        }
        return new List($.type[1], $, this.onError)
    }
    onProperty() {
        //
    }
    onUnexpectedProperty() {
        //
    }
    onState(stateGroupName: string, stateName: string) {

        const prop = this.definition.properties.getUnsafe(stateGroupName)
        if (prop.type[0] !== "state group") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        const state = $.states.getUnsafe(stateName)
        return new Node(state.node, this.onError)
    }
    onTypeOpen() {
        //
    }
    onTypeClose() {
        //
    }
    onUnexpectedState() {
        //
    }
    onValue(
        propertyName: string,
        value: syncAPI.Value,
        range: bc.Range,
        data: bc.SimpleValueData,
        _definition: md.Value
    ) {
        const prop = this.definition.properties.getUnsafe(propertyName)
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
    onComponent(name: string) {
        const prop = this.definition.properties.getUnsafe(name)
        if (prop.type[0] !== "component") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        return new Node($.type.get().node, this.onError)
    }
}
