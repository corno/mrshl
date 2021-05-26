import * as astn from "astn"
import * as p from "pareto-20"
import { createDeserializer } from "./deserialize"
import { createNOPSideEffects } from "./NOPSideEffects"
import { CreateSchemaAndSideEffects, SchemaAndSideEffects } from "../../../API/CreateSchemaAndSideEffects"
import { InternalSchemaDeserializationError } from "../../../API/SchemaErrors"
import { InternalSchemaError } from "../../../API/SchemaErrors"

export const createSchemaAndSideEffects: CreateSchemaAndSideEffects = (
    onSchemaError: (error: InternalSchemaDeserializationError, range: astn.Range) => void,
): astn.TextParserEventConsumer<SchemaAndSideEffects, null> => {
    let foundError = false
    let metadata: null | SchemaAndSideEffects = null

    function createInternalSchemaHandler<Result>(
        onSchemaError: (error: InternalSchemaError, range: astn.Range) => void,
        onObject: astn.OnObject<astn.ParserAnnotationData> | null,
        onSimpleValue: astn.OnSimpleValue<astn.ParserAnnotationData> | null,
        onEnd: () => p.IUnsafeValue<Result, null>
    ): astn.TextParserEventConsumer<Result, null> {
        return astn.createStackedParser(
            {
                onExists: {
                    array: data => {
                        onSchemaError(["unexpected schema format", { found: ["array"] }], data.annotation.range)
                        return astn.createDummyArrayHandler()
                    },
                    object: onObject !== null
                        ? onObject
                        : data => {
                            onSchemaError(["unexpected schema format", { found: ["object"] }], data.annotation.range)
                            return astn.createDummyObjectHandler()
                        },
                    simpleValue: onSimpleValue !== null
                        ? onSimpleValue
                        : data => {
                            onSchemaError(["unexpected schema format", { found: ["simple value"] }], data.annotation.range)
                            return p.value(false)
                        },
                    taggedUnion: data => {
                        onSchemaError(["unexpected schema format", { found: ["tagged union"] }], data.annotation.range)
                        return {
                            option: (): astn.RequiredValueHandler<astn.ParserAnnotationData> => astn.createDummyRequiredValueHandler(),
                            missingOption: (): void => {
                                //
                            },
                            end: () => {
                                //
                            },
                        }
                    },
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
            (error, annotation) => {
                onSchemaError(["expect", error], annotation.range)
            },
            (errorMessage, annotation) => {
                onSchemaError(["validation", { message: errorMessage }], annotation.range)
            },
            md2 => {
                metadata = md2 === null
                    ? null
                    : {
                        schema: md2,
                        createAdditionalValidator: () => createNOPSideEffects(),
                    }
            }
        ),
        null,
        () => {
            if (metadata === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                return p.error<SchemaAndSideEffects, null>(null)
            } else {
                return p.success(metadata)
            }
        }
    )
}