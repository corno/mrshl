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

const schemaSchemas: {
    [key: string]: (nodeBuilder: NodeBuilder, onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilder | null) => void) => bc.DataSubscriber
} = {
}

const schemasDir = path.join(__dirname, "/metaDeserializers")
fs.readdirSync(schemasDir, { encoding: "utf-8" }).forEach(dir => {
    schemaSchemas[dir] = require(path.join(schemasDir, dir)).deserialize
})

export function deserializeSchema(nodeBuilder: NodeBuilder, onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilder | null) => void): bc.Tokenizer {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }

    const schemaParser = new bc.Parser(
        (message, range) => {
            onSchemaError(`error in schema ${message}`, range)
        },
        {
            allow: bc.lax,
        }
    )
    const schemaTok = new bc.Tokenizer(
        schemaParser,
        (message, range) => {
            onSchemaError(message, range)
        }
    )
    let schemaDefinitionFound = false
    let schemaProcessor: null | bc.DataSubscriber = null

    schemaParser.onschemadata.subscribe(bc.createStackedDataSubscriber(
        {
            array: range => {
                onSchemaError("unexpected array as schema", range)
                return bc.createDummyArrayHandler()
            },
            null: range => {
                onSchemaError("unexpected null as schema", range)
            },
            object: range => {
                onSchemaError("unexpected object as schema", range)
                return bc.createDummyObjectHandler()
            },
            boolean: (_value, range) => {
                onSchemaError("unexpected boolean as schema", range)
            },
            number: (_value, range) => {
                onSchemaError("unexpected number as schema", range)
            },
            string: (schemaSchemaReference, strRange) => {
                const schemaSchema = schemaSchemas[schemaSchemaReference]
                if (schemaSchema === undefined) {
                    onSchemaError(`unknown schema schema ${schemaSchemaReference}`, strRange)
                } else {
                    schemaProcessor = schemaSchema(nodeBuilder, onError, callback)
                }
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
            //ignore end commends
        }
    ))
    schemaParser.onheaderdata.subscribe({
        onheaderstart: () => {
            schemaDefinitionFound = true
        },
        oncompact: () => {
            //compact = true
        },
        onheaderend: range => {
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
                    schemaParser.ondata.subscribe(schemaProcessor)
                }
            }
        },
    })
    return schemaTok
}

export function deserializeSchemaFromString(serializedSchema: string, nodeBuilder: NodeBuilder, onError: (message: string, range: bc.Range) => void): Promise<SchemaAndNodeBuilder> {
    return new Promise((resolve, reject) => {
        const schemaTok = deserializeSchema(nodeBuilder, onError, schema => {
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
    return (reference: string, nodeBuilder: NodeBuilder): Promise<SchemaAndNodeBuilder> => {
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
                    reject("schema not found")
                }
                const schemaTok = deserializeSchema(
                    nodeBuilder,
                    () => {
                        //do nothing with errors
                    },
                    schema => {
                        if (schema !== null) {
                            resolve(schema)
                        } else {
                            reject("errors in schema")
                        }
                    })
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