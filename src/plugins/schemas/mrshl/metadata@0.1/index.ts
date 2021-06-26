import * as astncore from "astn-core"
import * as p from "pareto-20"
import { createDeserializer } from "./deserialize"
import { createNOPSideEffects } from "./NOPSideEffects"
import { SchemaAndSideEffects } from "astn-core"
import { InternalSchemaError } from "astn-core"
import { InternalSchemaDeserializationError } from "../../../../interfaces/internalSchemaDerializationError"

export function createSchemaAndSideEffects<Annotation>(
    onSchemaError: (error: InternalSchemaDeserializationError, annotation: Annotation) => void,
): astncore.ITreeBuilder<Annotation, SchemaAndSideEffects<Annotation>, null> {
    let foundError = false
    let metadata: null | SchemaAndSideEffects<Annotation> = null

    function createInternalSchemaHandler<Result>(
        onSchemaError: (error: InternalSchemaError, annotation: Annotation) => void,
        onObject: astncore.OnObject<Annotation, null, p.IValue<null>> | null,
        onSimpleValue: astncore.OnSimpleString<Annotation, p.IValue<null>> | null,
        onEnd: () => p.IUnsafeValue<Result, null>
    ): astncore.ITreeBuilder<Annotation, Result, null> {
        return astncore.createStackedParser(
            {
                root: {
                    exists: {
                        array: data => {
                            onSchemaError(["unexpected schema format", { found: ["array"] }], data.annotation)
                            return astncore.createDummyArrayHandler(() => p.value(null))
                        },
                        object: onObject !== null
                            ? onObject
                            : data => {
                                onSchemaError(["unexpected schema format", { found: ["object"] }], data.annotation)
                                return astncore.createDummyObjectHandler(() => p.value(null))
                            },
                        multilineString: data => {
                            onSchemaError(["unexpected schema format", { found: ["multiline string"] }], data.annotation)
                            return p.value(null)
                        },
                        simpleString: onSimpleValue !== null
                            ? onSimpleValue
                            : data => {
                                onSchemaError(["unexpected schema format", { found: ["simple value"] }], data.annotation)
                                return p.value(null)
                            },
                        taggedUnion: data => {
                            onSchemaError(["unexpected schema format", { found: ["tagged union"] }], data.annotation)
                            return {
                                option: (): astncore.RequiredValueHandler<Annotation, null, p.IValue<null>> => astncore.createDummyRequiredValueHandler(() => p.value(null)),
                                missingOption: (): void => {
                                    //
                                },
                                end: () => {
                                    return p.value(null)
                                },
                            }
                        },
                    },
                    missing: () => {
                        //
                    },
                },
            },
            error => {
                onSchemaError(["stacked", error.type], error.annotation)
            },
            onEnd,
            () => astncore.createDummyValueHandler(() => p.value(null)),
        )
    }
    return createInternalSchemaHandler(
        (error, range) => {
            onSchemaError(["internal schema", error], range)
            foundError = true
        },
        createDeserializer<Annotation, null, p.IValue<null>>(
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
            },
            () => p.value(null),
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