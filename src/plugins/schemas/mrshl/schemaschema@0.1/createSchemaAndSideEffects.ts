import * as astncore from "astn-core"
import { createDeserializer } from "./createDeserializer"
import * as t from "./types"
import { convertToGenericSchema } from "./createTypedParserDefinitions"
import * as p from "pareto-20"
import * as sideEffects from "./sideEffects"
import { SchemaAndSideEffects } from "../../../../parserSpecific"
import { InternalSchemaDeserializationError } from "../../../../parserSpecific"
import { EmbeddedSchemaError } from "../../../../parserSpecific"

export function createSchemaAndSideEffects<Annotation>(
    onSchemaError: (error: InternalSchemaDeserializationError, annotation: Annotation) => void,
): astncore.ITreeBuilder<Annotation, SchemaAndSideEffects<Annotation>, null> {
    const isb = createInternalSchemaBuilder(onSchemaError)
    return {
        onData: (data: astncore.TreeBuilderEvent<Annotation>): p.IValue<boolean> => {
            return isb.onData(data)
        },
        onEnd: (aborted, endAnnotation) => {
            return isb.onEnd(aborted, endAnnotation).mapResult(schema => {
                return p.value({
                    schema: convertToGenericSchema(schema),
                    createStreamingValidator: (
                        onValidationError: (message: string, annotation: Annotation, severity: astncore.DiagnosticSeverity) => void,
                    ) => sideEffects.createRoot<Annotation>(schema, onValidationError),
                })
            })
        },
    }
}

export function createInternalSchemaBuilder<Annotation>(
    onSchemaError: (error: InternalSchemaDeserializationError, annotation: Annotation) => void,
): astncore.ITreeBuilder<Annotation, t.Schema, null> {
    let foundError = false
    let metaData: null | t.Schema = null

    function onSchemaSchemaError(error: InternalSchemaDeserializationError, annotation: Annotation) {
        onSchemaError(error, annotation)
        foundError = true
    }

    function onSchemaError2(error: EmbeddedSchemaError, annotation: Annotation) {
        onSchemaError(["internal schema", error], annotation)
        foundError = true
    }

    return astncore.createStackedParser(
        {
            root: {
                exists: createDeserializer(
                    (errorMessage, range) => {
                        onSchemaSchemaError(["expect", errorMessage], range)
                    },
                    (message, range) => {
                        onSchemaSchemaError(["validation", { message: message }], range)
                    },
                    md2 => {
                        metaData = md2
                    },
                    () => p.value(null)
                ),
                missing: () => {
                    //
                },
            },
        },
        error => {
            onSchemaError2(["stacked", error.type], error.annotation)
        },

        (): p.IUnsafeValue<t.Schema, null> => {
            if (metaData === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                return p.error(null)
            } else {
                return p.success(metaData)
            }
        },
        () => astncore.createDummyValueHandler(() => p.value(null))
    )
}