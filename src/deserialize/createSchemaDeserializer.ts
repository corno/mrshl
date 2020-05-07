import * as bc from "bass-clarinet"
import * as path from "path"
import * as ds from "../datasetAPI"

type AttachSchemaDeserializer = (parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: ds.Dataset | null) => void) => void

const schemasDir = path.join(__dirname, "/../schemas")

export function createSchemaDeserializer(onError: (message: string, range: bc.Range) => void, callback: (schema: ds.Dataset | null) => void): bc.Tokenizer {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }

    const schemaParser = new bc.Parser(
        (message, range) => {
            onSchemaError(`error in schema ${message}`, range)
        },
    )
    const schemaTok = new bc.Tokenizer(
        schemaParser,
        (message, range) => {
            onSchemaError(message, range)
        }
    )
    let schemaDefinitionFound = false
    let schemaProcessor: null | AttachSchemaDeserializer = null

    //attach the schema schema deserializer
    schemaParser.onschemadata.subscribe(bc.createStackedDataSubscriber(
        {
            valueHandler: {
                array: openData => {
                    onSchemaError("unexpected array as schema schema", openData.range)
                    return bc.createDummyArrayHandler()
                },
                object: openData => {
                    onSchemaError("unexpected object as schema schema", openData.range)
                    return bc.createDummyObjectHandler()
                },
                simpleValue: (schemaSchemaReference, svData) => {
                    function x(dir: string) {
                        const attachFunc = require(path.join(schemasDir, dir)).attachSchemaDeserializer
                        if (attachFunc === undefined) {
                            console.error(`skipping schema '${dir}, no attachSchemaDeserializer function`)
                            return null
                        }
                        if (typeof attachFunc !== "function") {
                            console.error(`skipping schema '${dir}, no attachSchemaDeserializer function`)
                            return null
                        }
                        return attachFunc
                    }
                    const schemaSchema = x(schemaSchemaReference)
                    if (schemaSchema === null) {
                        onSchemaError(`unknown schema schema ${schemaSchemaReference}`, svData.range)
                    } else {
                        schemaProcessor = schemaSchema
                    }
                },
                taggedUnion: tuData => {
                    onSchemaError("unexpected typed union as schema schema", tuData.range)
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
        }
    ))
    schemaParser.onheaderdata.subscribe({
        onHeaderStart: () => {
            schemaDefinitionFound = true
        },
        onCompact: () => {
            //compact = true
        },
        onHeaderEnd: range => {
            if (!schemaDefinitionFound) {
                onSchemaError(`missing schema schema definition`, range)
                callback(null)
            } else {
                if (schemaProcessor === null) {
                    if (!foundError) {
                        throw new Error("UNEXPECTED: SCHEMA PROCESSOR NOT SUBSCRIBED AND NO ERRORS")
                    }
                    callback(null)
                } else {
                    schemaProcessor(schemaParser, onError, callback)
                }
            }
        },
    })
    return schemaTok
}

