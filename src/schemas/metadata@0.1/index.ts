import * as bc from "bass-clarinet"
import { SchemaAndNodeBuilderPair } from "../../deserialize"
import { Schema } from "./types"
import { createDeserializer } from "./deserialize"
import * as b from "./builders"

export function attachSchemaDeserializer(parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilderPair | null) => void) {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }
    let metadata: null | Schema = null


    parser.ondata.subscribe(bc.createStackedDataSubscriber(
        {
            array: openData => {
                onSchemaError("unexpected array as schema", openData.start)
                return bc.createDummyArrayHandler()
            },
            object: createDeserializer(
                (errorMessage, range) => {
                    onSchemaError(errorMessage, range)
                },
                md => {
                    metadata = md
                }
            ),
            simpleValue: (_value, svData) => {
                onSchemaError("unexpected simple value as schema", svData.range)
            },
            taggedUnion: (_value, tuData) => {
                onSchemaError("unexpected typed union as schema", tuData.startRange)
                return bc.createDummyValueHandler()
            },
        },
        error => {
            if (error.context[0] === "range") {
                onSchemaError(error.message, error.context[1])
            } else {
                onSchemaError(error.message, { start: error.context[1], end: error.context[1] })
            }
        },
        () => {
            if (metadata === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                callback(null)
            } else {
                callback({
                    schemaDefinition: metadata,
                    dataset: new b.DatasetBuilder(metadata),
                })
            }
        }
    ))
}