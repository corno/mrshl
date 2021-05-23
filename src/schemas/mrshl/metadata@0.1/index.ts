import * as astn from "astn"
import * as p from "pareto-20"
import { createDeserializer } from "./deserialize"
import { createNOPSideEffects } from "./NOPSideEffects"
import { CreateSchemaAndSideEffects, SchemaAndSideEffects } from "../../../API/CreateSchemaAndSideEffects"
import { InternalSchemaDeserializationError } from "../../../API/SchemaErrors"
import { InternalSchemaError } from "../../../API/SchemaErrors"

export const createSchemaAndSideEffects: CreateSchemaAndSideEffects = (
    onSchemaError: (error: InternalSchemaDeserializationError, range: astn.Range) => void,
): astn.ParserEventConsumer<SchemaAndSideEffects, null> => {
    let foundError = false
    let metadata: null | SchemaAndSideEffects = null

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
            (error, range) => {
                onSchemaError(["expect", error], range)
            },
            (errorMessage, range) => {
                onSchemaError(["validation", { message: errorMessage }], range)
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