import * as bc from "bass-clarinet-typed"
import * as md from "../metaDataSchema"
import { SideEffectsAPI } from "./SideEffectsAPI"
import { createDatasetDeserializer } from "./createDatasetDeserializer"
import * as ds from "../datasetAPI"

function createNoOperationPropertyHandler(
    _key: string,
    //propertyData: bc.PropertyData,
    _preData: bc.PreData,
    //registerSnippetGenerators: RegisterSnippetsGenerators,
): bc.ValueHandler {
    //registerSnippetGenerators.register(propertyData.keyRange, null, null)
    return createNoOperationValueHandler()
}

function createNoOperationValueHandler(): bc.ValueHandler {
    return {
        array: openData => {
            return createNoOperationArrayHandler(openData.start)
        },
        object: openData => {
            return createNoOperationObjectHandler(openData.start)
        },
        simpleValue: (_value, _stringData) => {
            //registerSnippetGenerators.register(stringData.range, null, null)
        },
        taggedUnion: () => {
            //registerSnippetGenerators.register(tuData.startRange, null, null)
            //registerSnippetGenerators.register(tuData.optionRange, null, null)
            return {
                option: () => createNoOperationRequiredValueHandler(),
                missingOption: () => {
                    //
                },
            }
        },
    }
}

function createNoOperationRequiredValueHandler(): bc.RequiredValueHandler {
    return {
        onMissing: () => {
            //
        },
        valueHandler: createNoOperationValueHandler(),
    }
}

function createNoOperationArrayHandler(_beginRange: bc.Range): bc.ArrayHandler {
    return {
        element: () => createNoOperationValueHandler(),
        end: _endData => {
            //registerSnippetGenerators.register(endData.range, null, null)
        },
    }
}

function createNoOperationObjectHandler(_beginRange: bc.Range): bc.ObjectHandler {
    //registerSnippetGenerators.register(beginRange, null, null)
    return {
        property: (_key, _keyData) => {
            //registerSnippetGenerators.register(keyData.keyRange, null, null)
            return createNoOperationRequiredValueHandler()
        },
        end: _endData => {
            //registerSnippetGenerators.register(endData.range, null, null)
        },
    }
}

export type ResolveSchemaReference = (
    reference: string,
) => Promise<ds.Dataset>


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
 * this function returns a promise to a dataset and the promise is resolved when the validation has been completed
 */
export function deserializeDataset(
    serializedDataset: string,
    startDataset: ds.Dataset | null,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (source: string, message: string, range: bc.Range) => void,
    onWarning: (source: string, message: string, range: bc.Range) => void,
    sideEffects: SideEffectsAPI | null,
): Promise<ds.Dataset> {
    return new Promise<ds.Dataset>((resolve, reject) => {
        const parser = new bc.Parser(
            (message, range) => {
                onError("parser", message, range)
            },
        )
        function attach(dataset: ds.Dataset, isCompact: boolean) {
            const context = new bc.ExpectContext(
                (message, range) => onError("expect", message, range),
                (message, range) => onWarning("expect", message, range),
                openData => createNoOperationArrayHandler(openData.start),
                openData => createNoOperationObjectHandler(openData.start),
                (key, _propertyData, preData) => createNoOperationPropertyHandler(key, preData),
                () => createNoOperationValueHandler(),
                bc.Severity.warning,
                bc.OnDuplicateEntry.ignore
            )

            const se = sideEffects === null ? new NOPSideEffects() : sideEffects
            parser.ondata.subscribe(bc.createStackedDataSubscriber(
                createDatasetDeserializer(
                    context,
                    dataset,
                    isCompact,
                    se,
                    (message, range) => onError("deserializer", message, range),
                ),
                error => {
                    onError("X", error.rangeLessMessage, error.range)
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
                    resolve(dataset)
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
        let datasetBuilder: ds.Dataset
        function onSchemaError(message: string, range: bc.Range) {
            onError("schema error", message, range)
            foundSchemaErrors = true
        }

        parser.onschemadata.subscribe(bc.createStackedDataSubscriber(
            {

                valueHandler: {
                    array: openData => {
                        onSchemaError("unexpected array as schema", openData.start)
                        return bc.createDummyArrayHandler()
                    },
                    object: md.createMetaDataDeserializer(
                        (errorMessage, range) => {
                            onSchemaError(errorMessage, range)
                        },
                        md2 => {
                            if (md2 !== null) {
                                datasetBuilder = md.createDatasetBuilder(md2)
                            }
                        }
                    ),
                    simpleValue: (schemaReference, svData) => {
                        svData.pauser.pause()
                        schemaReferenceResolver(schemaReference)
                            .then(dataset => {
                                datasetBuilder = dataset
                                svData.pauser.continue()
                            })
                            .catch(errorMessage => {
                                onSchemaError(errorMessage, svData.range)
                                svData.pauser.continue()
                            })
                    },
                    taggedUnion: tuData => {
                        onSchemaError("unexpected typed union as schema", tuData.startRange)
                        return {
                            option: () => bc.createDummyRequiredValueHandler(),
                            missingOption: () => {
                                //
                            },
                        }
                    },
                },
                onMissing: () => {
                    //
                },
            },
            error => {
                onSchemaError(error.rangeLessMessage, error.range)
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
                    if (startDataset === null) {
                        onError("structure", `missing schema`, { start: { position: 0, line: 1, column: 1 }, end: { position: 0, line: 1, column: 1 } })
                        reject("no schema")
                    } else {
                        //no internal schema, no problem
                        attach(
                            startDataset,
                            false
                        )
                    }
                } else {
                    if (datasetBuilder === undefined) {
                        if (!foundSchemaErrors) {
                            throw new Error("Unexpected: no schema errors and no schema")
                        }
                        reject("errors in schema")
                    } else {
                        if (startDataset === null) {
                            attach(
                                datasetBuilder,
                                compact,
                            )
                        } else {
                            if (compact) {
                                throw new Error("IMPLEMENT ME, EXTERNAL AND INTERAL SCHEMA AND DATA IS COMPACT")
                            }
                            onWarning(
                                "structure",
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
                                startDataset,
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
                onError("tokenizer", message, range)
            },
            serializedDataset,
        )
    })
}
