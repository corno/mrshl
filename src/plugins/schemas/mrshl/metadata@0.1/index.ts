import * as astncore from "astn-core"
import * as p from "pareto-20"
import { createDeserializer } from "./deserialize"
import { createNOPSideEffects } from "./NOPSideEffects"
import { SchemaAndSideEffects } from "../../../../interfaces/schemaPlugin/SchemaAndSideEffects"
import { InternalSchemaDeserializationError, InternalSchemaError } from "../../../../interfaces/schemaPlugin/internalSchemaDerializationError"

export function createSchemaAndSideEffects<Annotation> (
    onSchemaError: (error: InternalSchemaDeserializationError, annotation: Annotation) => void,
): astncore.ITreeBuilder<Annotation, SchemaAndSideEffects<Annotation>, null> {
    let foundError = false
    let metadata: null | SchemaAndSideEffects<Annotation> = null

    function createInternalSchemaHandler<Result>(
        onSchemaError: (error: InternalSchemaError, annotation: Annotation) => void,
        onObject: astncore.OnObject<Annotation, null> | null,
        onSimpleValue: astncore.OnString<Annotation> | null,
        onEnd: () => p.IUnsafeValue<Result, null>
    ): astncore.ITreeBuilder<Annotation, Result, null> {
        return astncore.createStackedParser(
            {
                root: {
                    exists: {
                        array: data => {
                            onSchemaError(["unexpected schema format", { found: ["array"] }], data.annotation)
                            return astncore.createDummyArrayHandler()
                        },
                        object: onObject !== null
                            ? onObject
                            : data => {
                                onSchemaError(["unexpected schema format", { found: ["object"] }], data.annotation)
                                return astncore.createDummyObjectHandler()
                            },
                        string: onSimpleValue !== null
                            ? onSimpleValue
                            : data => {
                                onSchemaError(["unexpected schema format", { found: ["simple value"] }], data.annotation)
                                return p.value(false)
                            },
                        taggedUnion: data => {
                            onSchemaError(["unexpected schema format", { found: ["tagged union"] }], data.annotation)
                            return {
                                option: (): astncore.RequiredValueHandler<Annotation, null> => astncore.createDummyRequiredValueHandler(),
                                missingOption: (): void => {
                                    //
                                },
                                end: () => {
                                    //
                                },
                            }
                        },
                    },
                    missing: () => {
                        //
                    },
                },
            },
            (error, annotation) => {
                onSchemaError(["stacked", error], annotation)
            },
            onEnd
        )
    }
    return createInternalSchemaHandler(
        (error, range) => {
            onSchemaError(["internal schema", error], range)
            foundError = true
        },
        createDeserializer<Annotation, null>(
            (error, annotation) => {
                onSchemaError(["expect", error], annotation)
            },
            (errorMessage, annotation) => {
                onSchemaError(["validation", { message: errorMessage }], annotation)
            },
            md2 => {
                metadata = md2 === null
                    ? null
                    : {
                        schema: md2,
                        createStreamingValidator: () => createNOPSideEffects(),
                        //createAsyncValidator: () => createNOPSideEffects(),
                    }
            }
        ),
        null,
        () => {
            if (metadata === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                return p.error<SchemaAndSideEffects<Annotation>, null>(null)
            } else {
                return p.success(metadata)
            }
        }
    )
}