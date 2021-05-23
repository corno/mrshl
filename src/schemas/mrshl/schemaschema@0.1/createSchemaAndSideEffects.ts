import * as astn from "astn"
import { createDeserializer } from "./createDeserializer"
import * as t from "./types"
import { convertToGenericSchema } from "./convert"
import * as p from "pareto-20"
import * as sideEffects from "./sideEffects"
import { DiagnosticSeverity } from "../../../API/DiagnosticSeverity"
import { SchemaAndSideEffects } from "../../../API/SchemaAndSideEffects"
import { InternalSchemaDeserializationError } from "../../../API/SchemaErrors"
import { InternalSchemaError } from "../../../API/SchemaErrors"

export function createSchemaAndSideEffects(
    onSchemaError: (error: InternalSchemaDeserializationError, range: astn.Range) => void,
): astn.ParserEventConsumer<SchemaAndSideEffects, null> {
    const isb = createInternalSchemaBuilder(onSchemaError)
    return {
        onData: (data: astn.BodyEvent): p.IValue<boolean> => {
            return isb.onData(data)
        },
        onEnd: (aborted: boolean, location: astn.Location): p.IUnsafeValue<SchemaAndSideEffects, null> => {
            return isb.onEnd(aborted, location).mapResult(schema => {
                return p.value({
                    schema: convertToGenericSchema(schema),
                    createAdditionalValidator: (
                        onValidationError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void,
                    ) => new sideEffects.Root(schema, onValidationError),
                })
            })
        },
    }
}

export function createInternalSchemaBuilder(
    onSchemaError: (error: InternalSchemaDeserializationError, range: astn.Range) => void,
): astn.ParserEventConsumer<t.Schema, null> {
    let foundError = false
    let metaData: null | t.Schema = null

    function onSchemaSchemaError(error: InternalSchemaDeserializationError, range: astn.Range) {
        onSchemaError(error, range)
        foundError = true
    }

    function createInternalSchemaHandler<Result>(
        onSchemaError: (error: InternalSchemaError, range: astn.Range) => void,
        onObject: astn.OnObject | null,
        onSimpleValue: astn.OnSimpleValue | null,
        onEnd: () => p.IUnsafeValue<Result, null>
    ): astn.ParserEventConsumer<Result, null> {
        return astn.createStackedDataSubscriber(
            {
                onValue: () => {
                    return {
                        array: (range: astn.Range): astn.ArrayHandler => {
                            onSchemaError(["unexpected schema format", { found: ["array"] }], range)
                            return astn.createDummyArrayHandler()
                        },
                        object: onObject !== null
                            ? onObject
                            : (range: astn.Range): astn.ObjectHandler => {
                                onSchemaError(["unexpected schema format", { found: ["object"] }], range)
                                return astn.createDummyObjectHandler()
                            },
                        simpleValue: onSimpleValue !== null
                            ? onSimpleValue
                            : (range: astn.Range, _data: astn.SimpleValueData): p.IValue<boolean> => {
                                onSchemaError(["unexpected schema format", { found: ["simple value"] }], range)
                                return p.value(false)
                            },
                        taggedUnion: (range: astn.Range): astn.TaggedUnionHandler => {
                            onSchemaError(["unexpected schema format", { found: ["tagged union"] }], range)
                            return {
                                option: (): astn.RequiredValueHandler => astn.createDummyRequiredValueHandler(),
                                missingOption: (): void => {
                                    //
                                },
                                end: () => {
                                    //
                                },
                            }
                        },
                    }
                },
                onMissing: () => {
                    //
                },
            },
            (error, range) => {
                onSchemaError(["stacked", error], range)
            },
            onEnd
        )
    }
    return createInternalSchemaHandler(
        (error, range) => {
            onSchemaError(["internal schema", error], range)
            foundError = true
        },
        createDeserializer(
            (errorMessage, range) => {
                onSchemaSchemaError(["expect", errorMessage], range)
            },
            (message, range) => {
                onSchemaSchemaError(["validation", { message: message }], range)
            },
            md2 => {
                metaData = md2
            }
        ),
        null,
        (): p.IUnsafeValue<t.Schema, null> => {
            if (metaData === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                return p.error(null)
            } else {
                return p.success(metaData)
            }
        }
    )
}