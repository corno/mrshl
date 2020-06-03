import * as bc from "bass-clarinet"
import * as p from "pareto"
import { schemas, CreateSchemaAndSideEffectsBuilderFunction, SchemaAndSideEffects } from "../schemas"
import { ParserEventConsumer } from "bass-clarinet"

export function createSchemaDeserializer(
    onError: (message: string, range: bc.Range) => void,
): p.IStreamConsumer<string, null, SchemaAndSideEffects, null> {
    let foundError = false

    let schemaDefinitionFound = false
    let schemaProcessor: null | CreateSchemaAndSideEffectsBuilderFunction = null
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }

    const schemaParser = bc.createParser<SchemaAndSideEffects, null>(
        (message, range) => {
            onSchemaError(`${message}`, range)
        }, {
        onHeaderStart: () => {
            schemaDefinitionFound = true
            return bc.createStackedDataSubscriber(
                {
                    valueHandler: {
                        array: range => {
                            onSchemaError("unexpected array as schema schema", range)
                            return bc.createDummyArrayHandler()
                        },
                        object: range => {
                            onSchemaError("unexpected object as schema schema", range)
                            return bc.createDummyObjectHandler()
                        },
                        simpleValue: (range, svData) => {
                            const createSchemaFunc = schemas[svData.value]
                            if (createSchemaFunc === undefined) {
                                console.error(`unknown schema schema '${svData.value},`)
                                onSchemaError(`unknown schema schema ${svData.value}`, range)
                            } else {
                                schemaProcessor = createSchemaFunc
                            }
                            return p.result(false)
                        },
                        taggedUnion: tuRange => {
                            onSchemaError("unexpected typed union as schema schema", tuRange)
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
                    onSchemaError(error.rangeLessMessage, error.range)
                },
                () => {
                    //ignore end commends
                    return p.success<null, null>(null)
                }
            )
        },
        onCompact: () => {
            //compact = true
        },
        onHeaderEnd: (range: bc.Range): ParserEventConsumer<SchemaAndSideEffects, null> => {
            if (!schemaDefinitionFound) {
                //console.error("missing schema schema definition")
                onSchemaError(`missing schema schema definition`, range)
                return {
                    onData: () => {
                        //
                        return p.result(true)
                    },
                    onEnd: () => {
                        return p.error(null)
                    },
                }
            } else {
                if (schemaProcessor === null) {
                    if (!foundError) {
                        throw new Error("UNEXPECTED: SCHEMA PROCESSOR NOT SUBSCRIBED AND NO ERRORS")
                    }
                    return {
                        onData: () => {
                            //
                            return p.result(true)
                        },
                        onEnd: () => {
                            return p.error(null)
                        },
                    }
                } else {
                    return schemaProcessor(
                        onError,
                    )
                }
            }
        },
    })
    //console.log("SCHEMA DESER")
    const schemaTok = bc.createStreamTokenizer(
        schemaParser,
        (message, range) => {
            onSchemaError(message, range)
        }
    )

    //attach the schema schema deserializer
    return schemaTok
}

