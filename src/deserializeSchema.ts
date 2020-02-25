import * as bc from "bass-clarinet"
import * as http from "http"
import * as url from "url"
import { createMetaDataDeserializer, Schema } from "../src"

export function deserializeSchema(onError: (message: string, range: bc.Range) => void, callback: (schema: Schema | null) => void): bc.Tokenizer {
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
            (message, location) => {
                onSchemaError(message, { start: location, end: location })
            }
        )
        let metadata: null | Schema = null
        schemaParser.ondata.subscribe(bc.createStackedDataSubscriber(
            {
                array: range => {
                    onSchemaError("unexpected array as schema", range)
                    return bc.createDummyArrayHandler()
                },
                null: range => {
                    onSchemaError("unexpected null as schema", range)
                },
                object: createMetaDataDeserializer(
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
                    callback(metadata)
                }
            }
        ))
        return schemaTok
}

export function deserializeSchemaFromString(serializedSchema: string, onError: (message: string, range: bc.Range) => void): Promise<Schema> {
    return new Promise((resolve, reject) => {
        const schemaTok = deserializeSchema(onError, schema => {
            if (schema === null) {
                reject("missing schema")
            } else {
                resolve(schema)
            }
        })
        schemaTok.write(serializedSchema)
        schemaTok.end()
    })
}


export function createFromURLSchemaDeserializer(host: string, pathStart: string, timeout: number) {
    return function resolveSchemaFromSite(
        reference: string,
    ): Promise<Schema> {
        return new Promise((resolve, reject) => {

            const errors: string[] = []
            function onSchemaError(message: string, _range: bc.Range) {
                errors.push(message)
            }
            const options = {
                host: host,
                path: url.resolve(pathStart, encodeURI(reference)),
                timeout: timeout,
            }
            const request = http.request(options, res => {

                const schemaTok = deserializeSchema(onSchemaError, schema => {
                    if (schema !== null) {
                        resolve(schema)
                    } else {
                        reject("missing schema")
                    }
                })
                res.on('data', chunk => {
                    schemaTok.write(chunk.toString())
                });
                res.on('end', () => {
                    schemaTok.end()
                });
            });
            request.on('timeout', () => {
                console.error("timeout")
                reject("timeout")
            });
            request.on('error', e => {
                console.error(e.message)
                reject(e.message)
            });
            request.end();
        })
    }
}