import * as bc from "bass-clarinet"
import { createDeserializer } from "./deserialize"
import * as t from "./types"
import { convert } from "./convert"
import { SchemaAndSideEffects } from "../../../schemas"
import * as ds from "../../../syncAPI"
import * as p from "pareto-20"
import { NodeSideEffectsAPI, DictionarySideEffectsAPI, ListSideEffectsAPI } from "../../../deserialize"
import { StringData } from "bass-clarinet"
import { DiagnosticSeverity } from "../../../loadDocument"

export * from "./types"

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

export class DictionarySideEffects implements DictionarySideEffectsAPI {
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
        return new NodeSideEffects(this.collectionDefinition.node, this.onError)
    }
}
export class ListSideEffects implements ListSideEffectsAPI {
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
        return new NodeSideEffects(this.collectionDefinition.node, this.onError)
    }
    onListClose() {
        //
    }
}


export class NodeSideEffects implements NodeSideEffectsAPI {
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
        return new DictionarySideEffects($.type[1], $, this.onError)
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
        return new ListSideEffects($.type[1], $, this.onError)
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
        return new NodeSideEffects(state.node, this.onError)
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
    onValue(name: string, data: StringData, value: ds.Value) {
        const prop = this.definition.properties.getUnsafe(name)
        if (prop.type[0] !== "value") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]

        const val = value.getValue()
        switch ($.type[0]) {
            case "boolean": {
                if (data.quote !== null) {
                    this.onError(`expected a boolean, found a quoted string`, data.range, DiagnosticSeverity.error)
                } else {
                    if (val !== "true" && val !== "false") {
                        this.onError(`value '${val}' is not a boolean`, data.range, DiagnosticSeverity.error)
                    }
                }
                break
            }
            case "number": {
                if (data.quote !== null) {
                    this.onError(`expected a number, found a quoted string`, data.range, DiagnosticSeverity.error)
                } else {
                    //eslint-disable-next-line no-new-wrappers
                    if (isNaN(new Number(val).valueOf())) {
                        this.onError(`value '${val}' is not a number`, data.range, DiagnosticSeverity.error)
                    }
                }
                break
            }
            case "string": {
                if (data.quote === null) {
                    this.onError(`expected a quoted string`, data.range, DiagnosticSeverity.error)
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
        return new NodeSideEffects($.type.get().node, this.onError)
    }
}

export function attachSchemaDeserializer(
    parser: bc.Parser,
    onSchemaError: (message: string, range: bc.Range) => void,
    onValidationError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void
): p.IUnsafePromise<SchemaAndSideEffects, null> {
    return attachSchemaDeserializer2(parser, onSchemaError).try(schema => {
        if (schema !== null) {
            return p.success({
                schema: convert(schema),
                sideEffects: new NodeSideEffects(schema["root type"].get().node, onValidationError),
            })
        } else {
            return p.error(null)
        }
    })
}

export function attachSchemaDeserializer2(
    parser: bc.Parser,
    onSchemaError: (message: string, range: bc.Range) => void,
): p.IUnsafePromise<t.Schema, null> {
    return p.wrapUnsafeFunction((onPromiseFail, onSuccess) => {
        let foundError = false
        function onSchemaSchemaError(message: string, range: bc.Range) {
            onSchemaError(message, range)
            foundError = true
        }
        let metaData: null | t.Schema = null

        parser.ondata.subscribe(bc.createStackedDataSubscriber(
            {
                valueHandler: {
                    array: openData => {
                        onSchemaSchemaError("unexpected array as schema", openData.range)
                        return bc.createDummyArrayHandler()
                    },
                    object: createDeserializer(
                        (errorMessage, range) => {
                            onSchemaSchemaError(errorMessage, range)
                        },
                        md2 => {
                            metaData = md2
                        }
                    ),
                    simpleValue: (_value, svData) => {
                        onSchemaSchemaError("unexpected string as schema", svData.range)
                    },
                    taggedUnion: tuData => {
                        onSchemaSchemaError("unexpected typed union as schema", tuData.range)
                        return {
                            option: () => bc.createDummyRequiredValueHandler(),
                            missingOption: () => {
                                //
                            },
                        }
                    },
                },
                onMissing: () => {
                    //
                },
            },
            error => {
                onSchemaSchemaError(error.rangeLessMessage, error.range)
            },
            () => {
                if (metaData === null) {
                    if (!foundError) {
                        throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                    }
                    onPromiseFail(null)
                } else {
                    onSuccess(metaData)
                }
            }
        ))
    })
}