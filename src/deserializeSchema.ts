import * as bc from "bass-clarinet"
import * as fs from "fs"
import * as http from "http"
import * as path from "path"
import * as url from "url"
import { Schema } from "../src/internalSchema"
import { NodeBuilder } from "./deserialize/api"

export type SchemaAndNodeBuilder = {
    schema: Schema
    nodeBuilder: NodeBuilder
}

type AttachSchemaDeserializer = (parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilder | null) => void) => void

const schemaSchemas: { [key: string]: AttachSchemaDeserializer } = {}

const schemasDir = path.join(__dirname, "/metaDeserializers")
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

export function deserializeSchema(onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilder | null) => void): bc.Tokenizer {
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

export function deserializeSchemaFromString(serializedSchema: string, onError: (message: string, range: bc.Range) => void): Promise<SchemaAndNodeBuilder> {
    return new Promise((resolve, reject) => {
        const schemaTok = deserializeSchema(onError, schema => {
            if (schema === null) {
                reject("missing schema")
            } else {
                resolve(schema)
            }
        })
        schemaTok.write(serializedSchema, {
            pause: () => {
                //
            },
            continue: () => {
                //
            },
        })
        schemaTok.end()
    })
}


export function createFromURLSchemaDeserializer(host: string, pathStart: string, timeout: number) {
    return (reference: string): Promise<SchemaAndNodeBuilder> => {
        return new Promise((resolve, reject) => {

            // //const errors: string[] = []
            // function onSchemaError(_message: string, _range: bc.Range) {
            //     //errors.push(message)
            // }
            const options = {
                host: host,
                path: url.resolve(pathStart, encodeURI(reference)),
                timeout: timeout,
            }
            const request = http.request(options, res => {

                if (res.statusCode !== 200) {
                    reject(`schema '${reference}' not found`)
                    return
                }
                const schemaTok = deserializeSchema(
                    message => {
                        //do nothing with errors
                        console.error("SCHEMA ERROR", message)
                    },
                    schema => {
                        if (schema !== null) {
                            resolve(schema)
                        } else {
                            reject(`errors in schema '${host}${url.resolve(pathStart, encodeURI(reference))}'`)
                        }
                    }
                )
                res.on('data', chunk => {
                    schemaTok.write(chunk.toString(), {
                        pause: () => {
                            //
                        },
                        continue: () => {
                            //
                        },
                    })
                });
                res.on('end', () => {
                    schemaTok.end()
                })
            })
            request.on('timeout', () => {
                console.error("timeout")
                reject("timeout")
            });
            request.on('error', e => {
                console.error(e.message)
                reject(e.message)
            });
            request.end()
        })
    }
}