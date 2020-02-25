import * as bc from "bass-clarinet"
import { Schema } from "./types"
import { createDeserializer } from "./deserialize"
import { SchemaAndNodeBuilder } from "../../deserializeSchema"
import { NodeBuilder } from "../../deserialize"

export function deserialize(nodeBuilder: NodeBuilder, onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilder | null) => void) {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }
    let metadata: null | Schema = null


    return bc.createStackedDataSubscriber(
        {
            array: range => {
                onSchemaError("unexpected array as schema", range)
                return bc.createDummyArrayHandler()
            },
            null: range => {
                onSchemaError("unexpected null as schema", range)
            },
            object: createDeserializer(
                (errorMessage, range) => {
                    onSchemaError(errorMessage, range)
                },
                md => {
                    metadata = md
                }
            ),
            boolean: (_value, range) => {
                onSchemaError("unexpected boolean as schema", range)
            },
            number: (_value, range) => {
                onSchemaError("unexpected number as schema", range)
            },
            string: (_value, range) => {
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
                    nodeBuilder: nodeBuilder,
                })
            }
        }
    )
}