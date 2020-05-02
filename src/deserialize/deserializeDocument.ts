import * as bc from "bass-clarinet"
import { createMetaDataDeserializer, createNodeBuilder } from "../metaDataSchema"
import * as types from "../metaDataSchema"
import { SideEffectsAPI } from "./SideEffectsAPI"
import { createNodeDeserializer } from "./createNodeDeserializer"
import { NodeBuilder } from "../builderAPI"

function createPropertyHandler(
    _key: string,
    //propertyData: bc.PropertyData,
    _preData: bc.PreData,
    //registerSnippetGenerators: RegisterSnippetsGenerators,
): bc.ValueHandler {
    //registerSnippetGenerators.register(propertyData.keyRange, null, null)
    return createValueHandler()
}

function createValueHandler(): bc.ValueHandler {
    return {
        array: openData => {
            return createArrayHandler(openData.start)
        },
        object: openData => {
            return createObjectHandler(openData.start)
        },
        simpleValue: (_value, _stringData) => {
            //registerSnippetGenerators.register(stringData.range, null, null)
        },
        taggedUnion: (_option, _tuData, _tuComments) => {
            //registerSnippetGenerators.register(tuData.startRange, null, null)
            //registerSnippetGenerators.register(tuData.optionRange, null, null)
            return createValueHandler()
        },
    }
}

function createArrayHandler(_beginRange: bc.Range): bc.ArrayHandler {
    return {
        element: () => createValueHandler(),
        end: _endData => {
            //registerSnippetGenerators.register(endData.range, null, null)
        },
    }
}

function createObjectHandler(_beginRange: bc.Range): bc.ObjectHandler {
    //registerSnippetGenerators.register(beginRange, null, null)
    return {
        property: (_key, _keyData) => {
            //registerSnippetGenerators.register(keyData.keyRange, null, null)
            return createValueHandler()
        },
        end: _endData => {
            //registerSnippetGenerators.register(endData.range, null, null)
        },
    }
}

export type SchemaAndNodeBuilderPair = {
    rootNodeDefinition: types.Node
    nodeBuilder: NodeBuilder
}

export type ResolveSchemaReference = (
    reference: string,
) => Promise<SchemaAndNodeBuilderPair>


export class NOPSideEffects implements SideEffectsAPI {
    onArrayTypeClose() {
        //
    }
    onArrayTypeOpen() {
        //
    }
    onDictionaryClose() {
        //
    }
    onUnexpectedDictionaryEntry() {
        //
    }
    onDictionaryEntry() {
        //
    }
    onDictionaryOpen() {
        //
    }
    onListClose() {
        //
    }
    onListOpen() {
        //
    }
    onListEntry() {
        //
    }
    onProperty() {
        //
    }
    onUnexpectedProperty() {
        //
    }
    onState() {
        //
    }
    onTypeOpen() {
        //
    }
    onTypeClose() {
        //
    }
    onUnexpectedState() {
        //
    }
    onValue() {
        //
    }
}

/**
 * this function returns a Promise<void> and the promise is resolved when the validation has been completed
 */
export function deserializeDocument(
    document: string,
    externalSchema: SchemaAndNodeBuilderPair | null,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (message: string, range: bc.Range) => void,
    onWarning: (message: string, range: bc.Range) => void,
    sideEffects: SideEffectsAPI | null,
): Promise<SchemaAndNodeBuilderPair> {
    return new Promise<SchemaAndNodeBuilderPair>((resolve, reject) => {
        const parser = new bc.Parser(
            (message, range) => {
                onError(message, range)
            },
        )
        function attach(schema: SchemaAndNodeBuilderPair, isCompact: boolean) {
            const context = new bc.ExpectContext(
                onError,
                onWarning,
                openData => createArrayHandler(openData.start),
                openData => createObjectHandler(openData.start),
                (key, _propertyData, preData) => createPropertyHandler(key, preData),
                () => createValueHandler(),
            )

            const se = sideEffects === null ? new NOPSideEffects() : sideEffects
            parser.ondata.subscribe(bc.createStackedDataSubscriber(
                createNodeDeserializer(
                    context,
                    schema.rootNodeDefinition,
                    schema.nodeBuilder,
                    isCompact,
                    null,
                    se,
                    onError,
                ),
                error => {
                    if (error.context[0] === "range") {
                        onError(error.message, error.context[1])
                    } else {
                        onError(error.message, { start: error.context[1], end: error.context[1] })
                    }
                },
                () => {
                    //
                }
            ))
            parser.ondata.subscribe({
                onCloseArray: () => {
                    //
                },
                onCloseObject: () => {
                    //
                },
                onWhitespace: () => {
                    //
                },
                onString: () => {
                    //
                },
                onOpenTaggedUnion: () => {
                    //
                },
                onOpenObject: () => {
                    //
                },
                onOpenArray: () => {
                    //
                },
                onNewLine: () => {
                    //
                },
                onEnd: () => {
                    resolve(schema)
                },
                onLineComment: () => {
                    //
                },
                onBlockComment: () => {
                    //
                },
                onComma: () => {
                    //
                },
                onColon: () => {
                    //
                },
            })
        }

        let compact = false

        let foundSchema = false
        let foundSchemaErrors = false
        let metaData: SchemaAndNodeBuilderPair
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
                                rootNodeDefinition: md["root type"].get().node,
                                nodeBuilder: createNodeBuilder(md["root type"].get().node),
                            }

                        }
                    }
                ),
                simpleValue: (schemaReference, svData) => {
                    svData.pauser.pause()
                    schemaReferenceResolver(schemaReference)
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
                        attach(
                            externalSchema,
                            false
                        )
                    }
                } else {
                    if (metaData === undefined) {
                        if (!foundSchemaErrors) {
                            throw new Error("Unexpected: no schema errors and no schema")
                        }
                        reject("errors in schema")
                    } else {
                        if (externalSchema === null) {
                            attach(
                                metaData,
                                compact,
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
                            attach(
                                externalSchema,
                                compact,
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
