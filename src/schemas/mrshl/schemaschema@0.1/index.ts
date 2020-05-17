import * as bc from "bass-clarinet"
import * as md from "../../../metaDataSchema"
import { createDeserializer } from "./deserialize"
import { Schema } from "./types"
import { convert } from "./convert"

export * from "./types"

export function attachSchemaDeserializer(parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: md.Schema | null) => void) {
    attachSchemaDeserializer2(parser, onError, schema => {
        if (schema === null) {
            callback(null)
        } else {
            callback(convert(schema))
        }
    })
}

export function attachSchemaDeserializer2(parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: Schema | null) => void) {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }
    let metaData: null | Schema = null

    parser.ondata.subscribe(bc.createStackedDataSubscriber(
        {
            valueHandler: {
                array: openData => {
                    onSchemaError("unexpected array as schema", openData.range)
                    return bc.createDummyArrayHandler()
                },
                object: createDeserializer(
                    (errorMessage, range) => {
                        onSchemaError(errorMessage, range)
                    },
                    md2 => {
                        metaData = md2
                    }
                ),
                simpleValue: (_value, svData) => {
                    onSchemaError("unexpected string as schema", svData.range)
                },
                taggedUnion: tuData => {
                    onSchemaError("unexpected typed union as schema", tuData.range)
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
            if (metaData === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                callback(null)
            } else {
                callback(metaData)
            }
        }
    ))
}