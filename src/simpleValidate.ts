/* eslint
    max-classes-per-file: "off",
*/

import * as bc from "bass-clarinet"
import * as fs from "fs"
import * as path from "path"
import { createDeserializer, createMetaDataDeserializer, Schema } from "../src"
import { NodeBuilder } from "./deserialize"

class InvalidSchemaError extends Error {
    readonly range: bc.Range
    constructor(message: string, range: bc.Range) {
        super(message)
        this.range = range
    }
}

export function validateDocument(
    document: string,
    schemasDir: string,
    nodeBuilder: NodeBuilder,
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

    let metaData: Schema | null = null

    parser.onheaderdata.subscribe({
        oncompact: (isCompact, range) => {
            if (metaData === null) {
                throw new InvalidSchemaError("unexpected; no meta data", range)
            }
            parser.ondata.subscribe(createDeserializer(metaData, onError, onWarning, nodeBuilder, isCompact))
        },
        onschemastart: () => {
            //
        },
        onschemaend: () => {
            //
        },
    })

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
            string: schemaReference => {
                const serializedSchema = fs.readFileSync(path.join(schemasDir, schemaReference), { encoding: "utf-8" })

                const schemaParser = new bc.Parser(
                    err => {
                        throw new InvalidSchemaError(`error in schema ${err.rangeLessMessage} ${bc.printRange(err.range)}`, err.range)

                    },
                    {
                        allow: bc.lax,
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
                            metaData = md
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
                const schemaTok = new bc.Tokenizer(
                    schemaParser,
                    err => {
                        onError(err.locationLessMessage, { start: err.location, end: err.location })
                    }
                )
                try {
                    schemaTok.write(serializedSchema)
                    schemaTok.end()
                } catch (e) {
                    if (e instanceof bc.RangeError) {
                        onError(e.rangeLessMessage, e.range)
                    } else if (e instanceof bc.LocationError) {
                        onError(e.locationLessMessage, { start: e.location, end: e.location })
                    } else {
                        throw e
                    }
                }

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

    const tok = new bc.Tokenizer(
        parser,
        err => {
            onError(err.locationLessMessage, { start: err.location, end: err.location })
        }
    )
    try {
        tok.write(document)
        tok.end()
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
