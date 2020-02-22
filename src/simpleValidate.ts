/* eslint
    max-classes-per-file: "off",
*/

import * as bc from "bass-clarinet"
import * as http from "http"
import { createDeserializer, createMetaDataDeserializer, Schema } from "../src"
import { NodeBuilder } from "./deserialize"

class InvalidSchemaError extends Error {
    readonly range: bc.Range
    constructor(message: string, range: bc.Range) {
        super(message)
        this.range = range
    }
}

type ResolveSchemaReference = (
    reference: string,
    onError: (message: string) => void,
    onSuccess: (schema: Schema) => void
) => void

export function deserializeSchema(
    serializedSchema: string,
    onError: (message: string, range: bc.Range) => void,
    //onWarning: (message: string, range: bc.Range) => void,
    onSuccess: (schema: Schema) => void
) {

    const schemaParser = new bc.Parser(
        err => {
            throw new InvalidSchemaError(`error in schema ${err.rangeLessMessage} ${bc.printRange(err.range)}`, err.range)

        },
        {
            allow: bc.lax,
        }
    )
    const schemaTok = new bc.Tokenizer(
        schemaParser,
        err => {
            onError(err.locationLessMessage, { start: err.location, end: err.location })
        }
    )
    schemaParser.ondata.subscribe(bc.createStackedDataSubscriber(
        {
            array: range => {
                throw new InvalidSchemaError("unexpected array as schema", range)
            },
            null: range => {
                throw new InvalidSchemaError("unexpected null as schema", range)
            },
            object: createMetaDataDeserializer(md => {
                onSuccess(md)
            }),
            boolean: (_value, range) => {
                throw new InvalidSchemaError("unexpected value as schema", range)
            },
            number: (_value, range) => {
                throw new InvalidSchemaError("unexpected value as schema", range)
            },
            string: (_value, range) => {
                throw new InvalidSchemaError("unexpected value as schema", range)
            },
            taggedUnion: (_value, range) => {
                throw new InvalidSchemaError("unexpected typed union as schema", range)
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
            //ignore end comments
        }
    ))
    schemaTok.write(serializedSchema)
    schemaTok.end()
}

export function validateDocumentWithoutExternalSchema(
    document: string,
    nodeBuilder: NodeBuilder,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (message: string, range: bc.Range) => void,
    onWarning: (message: string, range: bc.Range) => void,

) {
    const parser = new bc.Parser(
        err => {
            onError(err.rangeLessMessage, err.range)
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
        err => {
            onError(err.locationLessMessage, { start: err.location, end: err.location })
        }
    )

    extractSchema(
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

    try {
        tok.onreadyforwrite.subscribe(() => {
            tok.end()
        })
        tok.write(document)
    } catch (e) {
        if (e instanceof bc.RangeError) {
            onError(e.rangeLessMessage, e.range)
        } else if (e instanceof bc.LocationError) {
            onError(e.locationLessMessage, { start: e.location, end: e.location })
        } else {
            throw e
        }
    }
}

interface Pauser {
    pause(): void
    continue(): void
}

function extractSchema(
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
                throw new InvalidSchemaError("unexpected array as schema", range)
            },
            null: range => {
                throw new InvalidSchemaError("unexpected null as schema", range)
            },
            object: createMetaDataDeserializer(md => {
                metaData = md
            }),
            boolean: (_value, range) => {
                throw new InvalidSchemaError("unexpected boolean as schema", range)
            },
            number: (_value, range) => {
                throw new InvalidSchemaError("unexpected number as schema", range)
            },
            string: (schemaReference, strRange) => {
                pauser.pause()
                schemaReferenceResolver(
                    schemaReference,
                    error => {
                        console.error(error)
                        onError("could not resolve referenced schema", strRange)
                    },
                    md => {
                        metaData = md
                        pauser.continue()
                    }
                )
            },
            taggedUnion: (_value, range) => {
                throw new InvalidSchemaError("unexpected typed union as schema", range)

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
                if (metaData === null) {
                    throw new Error("SCHEMA WAS NOT RESOLVED")
                }
                onSchemaFound(metaData, compact)
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

) {
    const parser = new bc.Parser(
        err => {
            onError(err.rangeLessMessage, err.range)
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
        err => {
            onError(err.locationLessMessage, { start: err.location, end: err.location })
        }
    )

    extractSchema(
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

    try {
        tok.onreadyforwrite.subscribe(() => {
            tok.end()
        })
        tok.write(document)
    } catch (e) {
        if (e instanceof bc.RangeError) {
            onError(e.rangeLessMessage, e.range)
        } else if (e instanceof bc.LocationError) {
            onError(e.locationLessMessage, { start: e.location, end: e.location })
        } else {
            throw e
        }
    }
}

export function resolveSchemaFromSite(
    reference: string,
    onError: (message: string) => void,
    onSuccess: (schema: Schema) => void,
) {
    const options = {
        host: 'www.astn.io',
        path: '/dev/schemas/' + encodeURI(reference),
    }
    const request = http.request(options, res => {

        const schemaParser = new bc.Parser(
            err => {
                throw new InvalidSchemaError(`error in schema ${err.rangeLessMessage} ${bc.printRange(err.range)}`, err.range)

            },
            {
                allow: bc.lax,
            }
        )
        const schemaTok = new bc.Tokenizer(
            schemaParser,
            err => {
                onError(err.locationLessMessage)
            }
        )
        schemaParser.ondata.subscribe(bc.createStackedDataSubscriber(
            {
                array: range => {
                    throw new InvalidSchemaError("unexpected array as schema", range)
                },
                null: range => {
                    throw new InvalidSchemaError("unexpected null as schema", range)
                },
                object: createMetaDataDeserializer(md => {
                    onSuccess(md)
                }),
                boolean: (_value, range) => {
                    throw new InvalidSchemaError("unexpected value as schema", range)
                },
                number: (_value, range) => {
                    throw new InvalidSchemaError("unexpected value as schema", range)
                },
                string: (_value, range) => {
                    throw new InvalidSchemaError("unexpected value as schema", range)
                },
                taggedUnion: (_value, range) => {
                    throw new InvalidSchemaError("unexpected typed union as schema", range)
                },
            },
            error => {
                if (error.context[0] === "range") {
                    onError(error.message)
                } else {
                    onError(error.message)
                }
            },
            () => {
                //ignore end comments
            }
        ))
        res.on('data', chunk => {
            try {
                schemaTok.write(chunk.toString())
            } catch (e) {
                if (e instanceof bc.RangeError) {
                    onError(e.rangeLessMessage)
                } else if (e instanceof bc.LocationError) {
                    onError(e.locationLessMessage)
                } else {
                    throw e
                }
            }
        });
        res.on('end', () => {
            try {
                schemaTok.end()
            } catch (e) {
                if (e instanceof bc.RangeError) {
                    onError(e.rangeLessMessage)
                } else if (e instanceof bc.LocationError) {
                    onError(e.locationLessMessage)
                } else {
                    throw e
                }
            }
        });
    });
    request.on('error', e => {
        console.error(e.message)
        onError(e.message)
    });
    request.end();
}