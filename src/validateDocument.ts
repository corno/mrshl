import * as bc from "bass-clarinet"
import { createDeserializer, Schema } from "../src"
import { createDeserializer as createMetaDataDeserializer } from "../src/metaDeserializers/metadata@1.0/deserialize"
import { NodeBuilder } from "./deserialize"

export type ResolveSchemaReference = (
    reference: string,
) => Promise<Schema>

/**
 * this function returns a Promise<void> and the promise is resolved when the validation has been completed
 */
export function validateDocument(
    document: string,
    nodeBuilder: NodeBuilder,
    externalSchema: Schema | null,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (message: string, range: bc.Range) => void,
    onWarning: (message: string, range: bc.Range) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const parser = new bc.Parser(
            (message, range) => {
                onError(message, range)
            },
            {
                allow: bc.lax,
                require: {
                    schema: externalSchema === null, //if an external schema is provided, an internal schema is optional
                },
            }
        )

        const tok = new bc.Tokenizer(
            parser,
            (message, location) => {
                onError(message, { start: location, end: location })
            }
        )
        let compact = false

        let foundSchema = false
        let foundSchemaErrors = false
        let metaData: Schema | null = null

        function onSchemaError(message: string, range: bc.Range) {
            onError(message, range)
            foundSchemaErrors = true
        }

        parser.onschemadata.subscribe(bc.createStackedDataSubscriber(
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
                        metaData = md
                    }
                ),
                boolean: (_value, range) => {
                    onSchemaError("unexpected boolean as schema", range)
                },
                number: (_value, range) => {
                    onSchemaError("unexpected number as schema", range)
                },
                string: (schemaReference, strRange) => {
                    tok.pause()
                    schemaReferenceResolver(schemaReference)
                        .then(md => {
                            metaData = md
                            tok.continue()
                        })
                        .catch(errorMessage => {
                            onSchemaError(errorMessage, strRange)
                            tok.continue()

                        })
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
        parser.onheaderdata.subscribe({
            onheaderstart: () => {
                //
            },
            onschemastart: () => {
                foundSchema = true
            },
            oncompact: () => {
                compact = true
            },
            onheaderend: () => {
                if (!foundSchema) {

                    if (externalSchema === null) {
                        onError(`missing schema`, { start: { position: 0, line: 1, column: 1 }, end: { position: 0, line: 1, column: 1 } })
                    } else {
                        //no internal schema, no problem
                        parser.ondata.subscribe(createDeserializer(externalSchema, onError, onWarning, nodeBuilder, false))
                    }
                } else {
                    if (metaData === null) {
                        if (!foundSchemaErrors) {
                            throw new Error("Unexpected: no schema errors and no schema")
                        }
                        reject("errors in schema")
                    } else {
                        if (externalSchema === null) {
                            parser.ondata.subscribe(createDeserializer(metaData, onError, onWarning, nodeBuilder, compact))
                        } else {
                            if (compact) {
                                throw new Error("IMPLEMENT ME, EXTERNAL AND INTERAL SCHEMA AND DATA IS COMPACT")
                            }
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
                            parser.ondata.subscribe(createDeserializer(externalSchema, onError, onWarning, nodeBuilder, compact))
                        }
                    }
                }
            },
        })
        tok.onreadyforwrite.subscribe(() => {
            tok.end()
            resolve()
        })
        tok.write(document)
    })
}
