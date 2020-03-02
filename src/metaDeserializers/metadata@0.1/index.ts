import * as bc from "bass-clarinet"
import { Schema } from "./types"
import { createDeserializer } from "./deserialize"
import { SchemaAndNodeValidator } from "../../deserializeSchema"
import { DummyNodeValidator } from "./dummyValidators"

export function attachSchemaDeserializer(parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeValidator | null) => void) {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }
    let metadata: null | Schema = null


    parser.ondata.subscribe(bc.createStackedDataSubscriber(
        {
            array: range => {
                onSchemaError("unexpected array as schema", range)
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
            unquotedToken: (_value, range) => {
                onSchemaError("unexpected unquoted token as schema", range)
            },
            quotedString: (_value, range) => {
                onSchemaError("unexpected string as schema", range)
            },
            taggedUnion: (_value, range) => {
                onSchemaError("unexpected typed union as schema", range)
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
                    schema: metadata,
                    nodeValidator: new DummyNodeValidator(),
                })
            }
        }
    ))
}