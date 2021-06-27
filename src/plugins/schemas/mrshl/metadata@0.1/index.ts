import * as astncore from "astn-core"
import * as p from "pareto-20"
import { createDeserializer } from "./deserialize"
import { createNOPSideEffects } from "./NOPSideEffects"
import { SchemaAndSideEffects } from "../../../../parserSpecific"
import { EmbeddedSchemaError } from "../../../../parserSpecific"
import { InternalSchemaDeserializationError } from "../../../../parserSpecific"

export function createSchemaAndSideEffects<Annotation>(
    onSchemaError: (error: InternalSchemaDeserializationError, annotation: Annotation) => void,
): astncore.ITreeBuilder<Annotation, SchemaAndSideEffects<Annotation>, null> {
    let foundError = false
    let metadata: null | SchemaAndSideEffects<Annotation> = null

    function onSchemaError2(error: EmbeddedSchemaError, annotation: Annotation) {
        onSchemaError(["internal schema", error], annotation)
        foundError = true
    }
    function onSchemaError3(error: InternalSchemaDeserializationError, annotation: Annotation) {
        onSchemaError(error, annotation)
        foundError = true
    }

    return astncore.createStackedParser(
        {
            root: {
                exists: {
                    array: data => {
                        onSchemaError2(["unexpected schema format", { found: ["array"] }], data.annotation)
                        return astncore.createDummyArrayHandler(() => p.value(null))
                    },
                    object: createDeserializer<Annotation, null, p.IValue<null>>(
                        (error, annotation) => {
                            onSchemaError3(["expect", error], annotation)
                        },
                        (errorMessage, annotation) => {
                            onSchemaError3(["validation", { message: errorMessage }], annotation)
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
                    multilineString: data => {
                        onSchemaError2(["unexpected schema format", { found: ["multiline string"] }], data.annotation)
                        return p.value(null)
                    },
                    simpleString: data => {
                        onSchemaError2(["unexpected schema format", { found: ["simple value"] }], data.annotation)
                        return p.value(null)
                    },
                    taggedUnion: data => {
                        onSchemaError2(["unexpected schema format", { found: ["tagged union"] }], data.annotation)
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
            onSchemaError2(["stacked", error.type], error.annotation)
        },
        () => {
            if (metadata === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                return p.error<SchemaAndSideEffects<Annotation>, null>(null)
            } else {
                return p.success(metadata)
            }
        },
        () => astncore.createDummyValueHandler(() => p.value(null)),
    )
}