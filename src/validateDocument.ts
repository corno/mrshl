import * as bc from "bass-clarinet"
import { attachDeserializer } from "./deserialize"
import { createMetaDataDeserializer, createNodeValidator } from "./internalSchema"
import { NodeBuilder, RegisterSnippetsGenerators } from "./deserialize"
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
    registerSnippetGenerators: RegisterSnippetsGenerators,
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
                array: openData => {
                    onSchemaError("unexpected array as schema", openData.start)
                    return bc.createDummyArrayHandler()
                },
                object: createMetaDataDeserializer(
                    (errorMessage, range) => {
                        onSchemaError(errorMessage, range)
                    },
                    md => {
                        if (md !== null) {
                            metaData = {
                                schema: md,
                                nodeValidator: createNodeValidator(),
                            }

                        }
                    }
                ),
                // unquotedToken: (_value, range) => {
                //     onSchemaError("unexpected unquoted token as schema", range)
                // },
                simpleValue: (schemaReference, svData) => {
                    svData.pauser.pause()
                    schemaReferenceResolver(schemaReference, nodeBuilder)
                        .then(md => {
                            metaData = md
                            svData.pauser.continue()
                        })
                        .catch(errorMessage => {
                            onSchemaError(errorMessage, svData.range)
                            svData.pauser.continue()
                        })
                },
                taggedUnion: (_value, tuData) => {
                    onSchemaError("unexpected typed union as schema", tuData.startRange)
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
                            registerSnippetGenerators,
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
                                registerSnippetGenerators,
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
                                registerSnippetGenerators,
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
