import * as bc from "bass-clarinet-typed"
import * as md from "../metaDataSchema"
import { NodeSideEffectsAPI, DictionarySideEffectsAPI, ListSideEffectsAPI } from "./SideEffectsAPI"
import { createDatasetDeserializer } from "./createDatasetDeserializer"
import * as p from "pareto-20"
import { SchemaAndSideEffects } from "../schemas"
import { IDataset } from "../loadDocument"

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
            return createNoOperationArrayHandler(openData.range)
        },
        object: openData => {
            return createNoOperationObjectHandler(openData.range)
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

export class NOPSideEffects implements
    NodeSideEffectsAPI,
    ListSideEffectsAPI,
    DictionarySideEffectsAPI {
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
        return this
    }
    onDictionaryOpen() {
        return this
    }
    onListClose() {
        //
    }
    onListOpen() {
        return this
    }
    onListEntry() {
        return this
    }
    onUnexpectedListEntry() {
        //
    }
    onProperty() {
        //
    }
    onUnexpectedProperty() {
        //
    }
    onState() {
        return this
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
    onComponent() {
        return this
    }
}

/**
 * this function returns a promise to a dataset and the promise is resolved when the validation has been completed
 */
export function deserializeDataset(
    serializedDataset: string,
    onInternalSchemaResolved: (schemaAndSideEffects: SchemaAndSideEffects | null) => p.IUnsafePromise<IDataset, null>,
    schemaReferenceResolver: (
        reference: string,
    ) => p.IUnsafePromise<SchemaAndSideEffects, string>,
    onError: (source: string, message: string, range: bc.Range | null) => void,
    onWarning: (source: string, message: string, range: bc.Range | null) => void,
    sideEffects: NodeSideEffectsAPI[],
): p.IUnsafePromise<IDataset, string> {
    return p.wrapUnsafeFunction((onPromiseFail, onResult) => {
        const parser = new bc.Parser(
            (message, range) => {
                onError("parser", message, range)
            },
        )
        function attach(dataset: IDataset, isCompact: boolean) {
            const context = new bc.ExpectContext(
                (message, range) => onError("expect", message, range),
                (message, range) => onWarning("expect", message, range),
                openData => createNoOperationArrayHandler(openData.range),
                openData => createNoOperationObjectHandler(openData.range),
                (key, _propertyData, preData) => createNoOperationPropertyHandler(key, preData),
                () => createNoOperationValueHandler(),
                bc.Severity.warning,
                bc.OnDuplicateEntry.ignore
            )

            parser.ondata.subscribe(bc.createStackedDataSubscriber(
                createDatasetDeserializer(
                    context,
                    dataset.sync,
                    isCompact,
                    sideEffects,
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
                    onResult(dataset)
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

        let foundSchemaSpecification = false
        let foundSchemaErrors = false
        let internalSchemaAndSideEffects: SchemaAndSideEffects | null = null
        function onSchemaError(message: string, range: bc.Range) {
            onError("schema error", message, range)
            foundSchemaErrors = true
        }

        parser.onschemadata.subscribe(bc.createStackedDataSubscriber(
            {
                valueHandler: {
                    array: openData => {
                        onSchemaError("unexpected array as schema", openData.range)
                        return bc.createDummyArrayHandler()
                    },
                    object: md.createMetaDataDeserializer(
                        (errorMessage, range) => {
                            onSchemaError(errorMessage, range)
                        },
                        md2 => {
                            if (md2 !== null) {
                                internalSchemaAndSideEffects = {
                                    schema: md2,
                                    sideEffects: new NOPSideEffects(),
                                }
                            }
                        }
                    ),
                    simpleValue: (schemaReference, svData) => {
                        svData.pauser.pause()
                        schemaReferenceResolver(schemaReference).handleUnsafePromise(
                            errorMessage => {
                                onSchemaError(errorMessage, svData.range)
                                svData.pauser.continue()
                            },
                            dataset => {
                                internalSchemaAndSideEffects = dataset
                                svData.pauser.continue()
                            },
                        )
                    },
                    taggedUnion: tuData => {
                        onSchemaError("unexpected typed union as schema", tuData.range)
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
                foundSchemaSpecification = true
            },
            onCompact: () => {
                compact = true
            },
            onHeaderEnd: () => {
                if (foundSchemaSpecification && internalSchemaAndSideEffects === null && !foundSchemaErrors) {
                    throw new Error("Unexpected: no schema errors and no schema")
                }
                const dataset = onInternalSchemaResolved(internalSchemaAndSideEffects)
                dataset.handleUnsafePromise(
                    () => {
                        onPromiseFail("no valid schema")
                    },
                    dset => {
                        if (foundSchemaSpecification) {
                            if (internalSchemaAndSideEffects === null) {
                                onWarning(
                                    "structure",
                                    "ignoring invalid internal schema",
                                    null
                                )

                            }
                        }
                        attach(dset, compact)
                    }
                )
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
