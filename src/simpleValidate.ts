/* eslint
    max-classes-per-file: "off",
*/

import * as bc from "bass-clarinet"
import * as http from "http"
import { createDeserializer, createMetaDataDeserializer, Schema } from "../src"
import { NodeBuilder } from "./deserialize"

export type ResolveSchemaReference = (
    reference: string,
) => Promise<Schema>

export function deserializeSchema(serializedSchema: string): Promise<Schema> {
    return new Promise((resolve, rejectx) => {

        function reject(message: string, range: bc.Range) {
            rejectx(`${message} @ ${bc.printRange(range)}`)
        }

        const schemaParser = new bc.Parser(
            (message, range) => {
                reject(`error in schema ${message}`, range)
            },
            {
                allow: bc.lax,
            }
        )
        const schemaTok = new bc.Tokenizer(
            schemaParser,
            (message, location) => {
                reject(message, { start: location, end: location })
            }
        )
        schemaParser.ondata.subscribe(bc.createStackedDataSubscriber(
            {
                array: range => {
                    reject("unexpected array as schema", range)
                    return bc.createDummyArrayHandler()
                },
                null: range => {
                    reject("unexpected null as schema", range)
                },
                object: createMetaDataDeserializer(
                    (errorMessage, range) => {
                        reject(errorMessage, range)
                    },
                    md => {
                        resolve(md)
                    }
                ),
                boolean: (_value, range) => {
                    reject("unexpected value as schema", range)
                },
                number: (_value, range) => {
                    reject("unexpected value as schema", range)
                },
                string: (_value, range) => {
                    reject("unexpected value as schema", range)
                },
                taggedUnion: (_value, range) => {
                    reject("unexpected typed union as schema", range)
                    return bc.createDummyValueHandler()
                },
            },
            error => {
                if (error.context[0] === "range") {
                    reject(error.message, error.context[1])
                } else {
                    reject(error.message, { start: error.context[1], end: error.context[1] })
                }
            },
            () => {
                //ignore end comments
            }
        ))
        try {
            schemaTok.write(serializedSchema)
            schemaTok.end()
        } catch (e) {
            //need to catch, createMetaDataDeserializer throws errors
            rejectx(e.message)
        }
    })
}

export function validateDocumentWithoutExternalSchema(
    document: string,
    nodeBuilder: NodeBuilder,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (message: string, range: bc.Range) => void,
    onWarning: (message: string, range: bc.Range) => void,

): Promise<void> {
    return new Promise((resolve, _reject) => {

        const parser = new bc.Parser(
            (message, range) => {
                onError(message, range)
            },
            {
                allow: bc.lax,
                require: {
                    schema: true,
                },
            }
        )


        const tok = new bc.Tokenizer(
            parser,
            (message, location) => {
                onError(message, { start: location, end: location })
            }
        )

        registerSchemaExtracter(
            tok,
            parser,
            schemaReferenceResolver,
            onError,
            () => {
                onError(
                    "missing schema",
                    {
                        start: {
                            position: 0,
                            line: 1,
                            column: 1,
                        },
                        end: {
                            position: 0,
                            line: 1,
                            column: 1,
                        },
                    }
                )
            },
            (schema, isCompact) => {
                parser.ondata.subscribe(createDeserializer(schema, onError, onWarning, nodeBuilder, isCompact))
            }
        )

        tok.onreadyforwrite.subscribe(() => {
            tok.end()
            resolve()
        })
        try {
            tok.write(document)
        } catch (e) {
            //need to catch, createMetaDataDeserializer throws errors
            _reject(e.message)
        }
    })
}

interface Pauser {
    pause(): void
    continue(): void
}

function registerSchemaExtracter(
    pauser: Pauser,
    parser: bc.Parser,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (message: string, range: bc.Range) => void,
    onSchemaNotFound: () => void,
    onSchemaFound: (schema: Schema, compact: boolean) => void,
) {
    let compact = false

    let foundSchema = false

    let metaData: Schema | null = null

    parser.onschemadata.subscribe(bc.createStackedDataSubscriber(
        {
            array: range => {
                onError("unexpected array as schema", range)
                return bc.createDummyArrayHandler()
            },
            null: range => {
                onError("unexpected null as schema", range)
            },
            object: createMetaDataDeserializer(
                (errorMessage, range) => {
                    onError(errorMessage, range)
                },
                md => {
                    metaData = md
                }
            ),
            boolean: (_value, range) => {
                onError("unexpected boolean as schema", range)
            },
            number: (_value, range) => {
                onError("unexpected number as schema", range)
            },
            string: (schemaReference, strRange) => {
                pauser.pause()
                schemaReferenceResolver(schemaReference)
                    .then(md => {
                        metaData = md
                        pauser.continue()
                    })
                    .catch(errorMessage => onError(errorMessage, strRange))
            },
            taggedUnion: (_value, range) => {
                onError("unexpected typed union as schema", range)
                return bc.createDummyValueHandler()
            },
        },
        error => {
            if (error.context[0] === "range") {
                onError(error.message, error.context[1])
            } else {
                onError(error.message, { start: error.context[1], end: error.context[1] })
            }
        },
        () => {
            //ignore end commends
        }
    ))
    parser.onheaderdata.subscribe({
        onheaderstart: () => {
            //
        },
        onschemastart: () => {
            foundSchema = true
        },
        onheaderend: () => {
            if (!foundSchema) {
                onSchemaNotFound()
            } else {
                if (metaData !== null) {
                    onSchemaFound(metaData, compact)
                }
            }
        },
        oncompact: () => {
            compact = true
        },
    })
}


export function validateDocumentWithExternalSchema(
    document: string,
    nodeBuilder: NodeBuilder,
    schema: Schema,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (message: string, range: bc.Range) => void,
    onWarning: (message: string, range: bc.Range) => void,
): Promise<void> {
    return new Promise((resolve, _reject) => {
        const parser = new bc.Parser(
            (message, range) => {
                onError(message, range)
            },
            {
                allow: bc.lax,
                require: {
                    //a schema is optional (not required because we have an external schema)
                },
            }
        )

        const tok = new bc.Tokenizer(
            parser,
            (message, location) => {
                onError(message, { start: location, end: location })
            }
        )

        registerSchemaExtracter(
            tok,
            parser,
            schemaReferenceResolver,
            onError,
            () => {
                //no schema, no problem
                parser.ondata.subscribe(createDeserializer(schema, onError, onWarning, nodeBuilder, false))
            },
            (_schema, isCompact) => {
                if (!isCompact) {
                    onWarning(
                        "ignoring internal schema",
                        {
                            start: {
                                position: 0,
                                line: 1,
                                column: 1,
                            },
                            end: {
                                position: 0,
                                line: 1,
                                column: 1,
                            },
                        }
                    )
                    parser.ondata.subscribe(createDeserializer(schema, onError, onWarning, nodeBuilder, isCompact))
                } else {
                    throw new Error("IMPLEMENT ME, EXTERNAL AND INTERAL SCHEMA AND DATA IS COMPACT")
                }

            }
        )

        tok.onreadyforwrite.subscribe(() => {
            tok.end()
            resolve()
        })
        try {
            tok.write(document)
        } catch (e) {
            //need to catch, createMetaDataDeserializer throws errors
            _reject(e.message)
        }
    })
}

export function resolveSchemaFromSite(
    reference: string,
): Promise<Schema> {
    return new Promise((resolve, rejectx) => {

        function reject(message: string, range: bc.Range) {
            rejectx(`${message} @ ${bc.printRange(range)}`)
        }
        const options = {
            host: 'www.astn.io',
            path: '/dev/schemas/' + encodeURI(reference),
        }
        const request = http.request(options, res => {

            const schemaParser = new bc.Parser(
                (message, range) => {
                    reject(`error in schema ${message} ${bc.printRange(range)}`, range)
                },
                {
                    allow: bc.lax,
                }
            )
            const schemaTok = new bc.Tokenizer(
                schemaParser,
                message => {
                    rejectx(message)
                }
            )
            schemaParser.ondata.subscribe(bc.createStackedDataSubscriber(
                {
                    array: range => {
                        reject("unexpected array as schema", range)
                        return bc.createDummyArrayHandler()
                    },
                    null: range => {
                        reject("unexpected null as schema", range)
                    },
                    object: createMetaDataDeserializer(
                        (errorMessage, range) => {
                            reject(errorMessage, range)
                        },
                        md => {
                            resolve(md)
                        }
                    ),
                    boolean: (_value, range) => {
                        reject("unexpected value as schema", range)
                    },
                    number: (_value, range) => {
                        reject("unexpected value as schema", range)
                    },
                    string: (_value, range) => {
                        reject("unexpected value as schema", range)
                    },
                    taggedUnion: (_value, range) => {
                        reject("unexpected typed union as schema", range)
                        return bc.createDummyValueHandler()
                    },
                },
                error => {
                    if (error.context[0] === "range") {
                        rejectx(error.message)
                    } else {
                        rejectx(error.message)
                    }
                },
                () => {
                    //ignore end comments
                }
            ))
            res.on('data', chunk => {
                schemaTok.write(chunk.toString())
            });
            res.on('end', () => {
                schemaTok.end()
            });
        });
        request.on('error', e => {
            console.error(e.message)
            rejectx(e.message)
        });
        request.end();
    })
}