import * as bc from "bass-clarinet"
import { attachDeserializer } from "./deserialize"
import { createMetaDataDeserializer } from "./internalSchema"
import { NodeBuilder } from "./deserialize"
import { SchemaAndNodeValidator } from "./deserializeSchema"

export type ResolveSchemaReference = (
    reference: string,
    nodeBuilder: NodeBuilder,
) => Promise<SchemaAndNodeValidator>

/**
 * this function returns a Promise<void> and the promise is resolved when the validation has been completed
 */
export function validateDocument(
    document: string,
    externalSchema: SchemaAndNodeValidator | null,
    nodeBuilder: NodeBuilder,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (message: string, range: bc.Range) => void,
    onWarning: (message: string, range: bc.Range) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const parser = new bc.Parser(
            (message, range) => {
                onError(message, range)
            },
        )

        let compact = false

        let foundSchema = false
        let foundSchemaErrors = false
        let metaData: SchemaAndNodeValidator | null = null

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
                        if (md !== null) {
                            metaData = {
                                schema: md,
                                nodeValidator: nodeBuilder,
                            }

                        }
                    }
                ),
                boolean: (_value, range) => {
                    onSchemaError("unexpected boolean as schema", range)
                },
                number: (_value, range) => {
                    onSchemaError("unexpected number as schema", range)
                },
                string: (schemaReference, strRange, _comments, pauser) => {
                    pauser.pause()
                    schemaReferenceResolver(schemaReference, nodeBuilder)
                        .then(md => {
                            metaData = md
                            pauser.continue()
                        })
                        .catch(errorMessage => {
                            onSchemaError(errorMessage, strRange)
                            pauser.continue()
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
            onHeaderStart: () => {
                foundSchema = true
            },
            onCompact: () => {
                compact = true
            },
            onHeaderEnd: () => {
                if (!foundSchema) {
                    if (externalSchema === null) {
                        onError(`missing schema`, { start: { position: 0, line: 1, column: 1 }, end: { position: 0, line: 1, column: 1 } })
                        reject("no schema")
                    } else {
                        //no internal schema, no problem
                        attachDeserializer(
                            parser,
                            externalSchema,
                            onError,
                            onWarning,
                            nodeBuilder,
                            false,
                            resolve
                        )
                    }
                } else {
                    if (metaData === null) {
                        if (!foundSchemaErrors) {
                            throw new Error("Unexpected: no schema errors and no schema")
                        }
                        reject("errors in schema")
                    } else {
                        if (externalSchema === null) {
                            attachDeserializer(
                                parser,
                                metaData,
                                onError,
                                onWarning,
                                nodeBuilder,
                                compact,
                                resolve
                            )
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
                            attachDeserializer(
                                parser,
                                externalSchema,
                                onError,
                                onWarning,
                                nodeBuilder,
                                compact,
                                resolve
                            )
                        }
                    }
                }
            },
        })
        bc.tokenizeString(
            parser,
            (message, range) => {
                onError(message, range)
            },
            document,
        )
    })
}
