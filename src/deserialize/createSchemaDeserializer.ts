import * as bc from "bass-clarinet"
import * as fs from "fs"
import * as path from "path"
import { SchemaAndNodeBuilderPair } from "./deserializeDocument"

type AttachSchemaDeserializer = (parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilderPair | null) => void) => void

const schemaSchemas: { [key: string]: AttachSchemaDeserializer } = {}

const schemasDir = path.join(__dirname, "/../schemas")
fs.readdirSync(schemasDir, { encoding: "utf-8" }).forEach(dir => {
    const attachFunc = require(path.join(schemasDir, dir)).attachSchemaDeserializer
    if (attachFunc === undefined) {
        console.error(`skipping schema '${dir}, no attachSchemaDeserializer function`)
        return
    }
    if (typeof attachFunc !== "function") {
        console.error(`skipping schema '${dir}, no attachSchemaDeserializer function`)
        return
    }
    schemaSchemas[dir] = attachFunc
})

export function createSchemaDeserializer(onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilderPair | null) => void): bc.Tokenizer {
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
            array: openData => {
                onSchemaError("unexpected array as schema schema", openData.start)
                return bc.createDummyArrayHandler()
            },
            object: openData => {
                onSchemaError("unexpected object as schema schema", openData.start)
                return bc.createDummyObjectHandler()
            },
            simpleValue: (schemaSchemaReference, svData) => {
                const schemaSchema = schemaSchemas[schemaSchemaReference]
                if (schemaSchema === undefined) {
                    onSchemaError(`unknown schema schema ${schemaSchemaReference}, (options: ${Object.keys(schemaSchemas)})`, svData.range)
                } else {
                    schemaProcessor = schemaSchema
                }
            },
            taggedUnion: (_value, tuData) => {
                onSchemaError("unexpected typed union as schema schema", tuData.startRange)
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

