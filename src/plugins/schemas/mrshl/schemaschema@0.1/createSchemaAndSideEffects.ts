import * as astncore from "astn-core"
import { createDeserializer } from "./createDeserializer"
import * as t from "./types"
import { convertToGenericSchema } from "./createTypedParserDefinitions"
import * as p from "pareto-20"
import * as sideEffects from "./sideEffects"
import { DiagnosticSeverity } from "astn-core"
import { SchemaAndSideEffects } from "astn-core"
import { InternalSchemaDeserializationError } from "../../../../interfaces/internalSchemaDerializationError"
import { InternalSchemaError } from "astn-core"

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
                        onValidationError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
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

    function createInternalSchemaHandler<Result>(
        onSchemaError: (error: InternalSchemaError, annotation: Annotation) => void,
        valueHandler: astncore.ValueHandler<Annotation, null, p.IValue<null>>,
        onEnd: () => p.IUnsafeValue<Result, null>
    ): astncore.ITreeBuilder<Annotation, Result, null> {
        return astncore.createStackedParser(
            {
                root: {
                    exists: valueHandler,
                    missing: () => {
                        //
                    },
                },
            },
            error => {
                onSchemaError(["stacked", error.type], error.annotation)
            },
            onEnd,
            () => astncore.createDummyValueHandler(() => p.value(null))
        )
    }

    return createInternalSchemaHandler(
        (error, annotation) => {
            onSchemaError(["internal schema", error], annotation)
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
            },
            () => p.value(null)
        ),
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