import * as bc from "bass-clarinet"
import * as p from "pareto-20"
import { createDeserializer } from "./deserialize"
import { SchemaAndSideEffects } from "../../schemas"
import { createNOPSideEffects } from "../../deserialize"

export function createSchemaAndSideEffects(
    onSchemaError: (message: string, range: bc.Range) => void,
): bc.ParserEventConsumer<SchemaAndSideEffects, null> {
    let foundError = false
    function onSchemaSchemaError(message: string, range: bc.Range) {
        onSchemaError(message, range)
        foundError = true
    }
    let metadata: null | SchemaAndSideEffects = null

    return bc.createStackedDataSubscriber(
        {
            onValue: () => {
                return {
                    array: (range: bc.Range): bc.ArrayHandler => {
                        onSchemaSchemaError("unexpected array as schema", range)
                        return bc.createDummyArrayHandler()
                    },
                    object: createDeserializer(
                        (errorMessage, range) => {
                            onSchemaSchemaError(errorMessage, range)
                        },
                        md2 => {
                            metadata = md2 === null
                                ? null
                                : {
                                    schema: md2,
                                    createSideEffects: () => createNOPSideEffects(),
                                }
                        }
                    ),
                    simpleValue: (range: bc.Range, _data: bc.SimpleValueData): p.IValue<boolean> => {
                        onSchemaSchemaError("unexpected simple value as schema", range)
                        return p.result(false)
                    },
                    taggedUnion: (range: bc.Range): bc.TaggedUnionHandler => {
                        onSchemaSchemaError("unexpected typed union as schema", range)
                        return {
                            option: (): bc.RequiredValueHandler => bc.createDummyRequiredValueHandler(),
                            missingOption: (): void => {
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
        error => {
            onSchemaSchemaError(error.rangeLessMessage, error.range)
        },
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