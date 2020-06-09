import * as bc from "bass-clarinet-typed"
import * as sideEffects from "../SideEffectsAPI"
import { createDatasetDeserializer } from "./createDatasetDeserializer"
import * as p20 from "pareto-20"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../schemas"
import { IDataset } from "../dataset"
import { InternalSchemaSpecification, InternalSchemaSpecificationType } from "../syncAPI"
import { createDeserializer as createMetaDataDeserializer } from "../schemas/metadata@0.1/deserialize"


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
        array: range => {
            return createNoOperationArrayHandler(range)
        },
        object: range => {
            return createNoOperationObjectHandler(range)
        },
        simpleValue: (_value, _stringData) => {
            //registerSnippetGenerators.register(stringData.range, null, null)
            return p.result(false)
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

class NOPSideEffects implements
    sideEffects.Node,
    sideEffects.List,
    sideEffects.Dictionary,
    sideEffects.Root {
    node: sideEffects.Node
    constructor() {
        this.node = this
    }
    onEnd() {
        //
    }
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

export function createNOPSideEffects(): sideEffects.Root {
    return new NOPSideEffects()
}

type InternalSchema = {
    specification: InternalSchemaSpecification
    schemaAndSideEffects: SchemaAndSideEffects
}

/**
 * this function returns a promise to a dataset and the promise is resolved when the validation has been completed
 */
export function deserializeDataset(
    serializedDataset: string,
    onInternalSchemaResolved: (internalSchema: InternalSchema | null, compact: boolean) => IDataset | null,
    schemaReferenceResolver: (
        reference: string,
    ) => p.IUnsafeValue<SchemaAndSideEffects, string>,
    onError: (source: string, message: string, range: bc.Range | null) => void,
    onWarning: (source: string, message: string, range: bc.Range | null) => void,
    sideEffectsHandlers: sideEffects.Root[],
): p.IUnsafeValue<IDataset, string> {


    function createDSD(dataset: IDataset, isCompact: boolean): bc.ParserEventConsumer<IDataset, string> {

        const context = new bc.ExpectContext(
            (message, range) => onError("expect", message, range),
            (message, range) => onWarning("expect", message, range),
            range => createNoOperationArrayHandler(range),
            range => createNoOperationObjectHandler(range),
            (_range, key, preData) => createNoOperationPropertyHandler(key, preData),
            () => createNoOperationValueHandler(),
            bc.Severity.warning,
            bc.OnDuplicateEntry.ignore
        )
        return bc.createStackedDataSubscriber(
            createDatasetDeserializer(
                context,
                dataset.sync,
                isCompact,
                sideEffectsHandlers.map(h => h.node),
                (message, range) => onError("deserializer", message, range),
            ),
            error => {
                onError("X", error.rangeLessMessage, error.range)
            },
            () => {
                sideEffectsHandlers.forEach(h => {
                    h.onEnd()
                })
                return p.success(dataset)
            }
        )
    }

    let compact = false

    let foundSchemaSpecification = false
    let foundSchemaErrors = false
    let internalSchema: InternalSchema | null = null
    const parser = bc.createParser<IDataset, string>(
        (message, range) => {
            onError("parser", message, range)
        },
        {
            onHeaderStart: () => {
                foundSchemaSpecification = true
                return bc.createStackedDataSubscriber(
                    {
                        valueHandler: {
                            array: range => {
                                onSchemaError("unexpected array as schema", range)
                                return bc.createDummyArrayHandler()
                            },
                            object: createMetaDataDeserializer(
                                (errorMessage, range) => {
                                    onSchemaError(errorMessage, range)
                                },
                                schema => {
                                    if (schema !== null) {
                                        internalSchema = {
                                            schemaAndSideEffects: {
                                                schema: schema,
                                                createSideEffects: () => new NOPSideEffects(),
                                            },
                                            specification: [InternalSchemaSpecificationType.Embedded],
                                        }
                                    }
                                }
                            ),
                            simpleValue: (range, data) => {
                                return schemaReferenceResolver(data.value).reworkAndCatch(
                                    errorMessage => {
                                        onSchemaError(errorMessage, range)
                                        return p.result(false)
                                    },
                                    schemaAndSideEffects => {
                                        internalSchema = {
                                            schemaAndSideEffects: schemaAndSideEffects,
                                            specification: [InternalSchemaSpecificationType.Reference, { name: data.value }],
                                        }
                                        return p.result(false)

                                    },
                                )
                            },
                            taggedUnion: range => {
                                onSchemaError("unexpected typed union as schema", range)
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
                        if (foundSchemaErrors) {
                            return p.error(null)
                        }
                        return p.success(null)
                    }
                )
            },
            onCompact: () => {
                compact = true
            },
            onHeaderEnd: (): bc.ParserEventConsumer<IDataset, string> => {
                if (foundSchemaSpecification && internalSchema === null && !foundSchemaErrors) {
                    console.error("NO SCHEMA AND NO ERROR")
                    //throw new Error("Unexpected: no schema errors and no schema")
                }
                const dataset = onInternalSchemaResolved(internalSchema, compact)

                if (dataset === null) {
                    return {
                        onData: () => {
                            //
                            return p.result(false)
                        },
                        onEnd: () => {
                            return p.error("no valid schema")
                        },
                    }
                }
                if (foundSchemaSpecification) {
                    if (internalSchema === null) {
                        onWarning(
                            "structure",
                            "ignoring invalid internal schema",
                            null
                        )

                    }
                }
                return createDSD(dataset, compact)
            },
        }
    )
    function onSchemaError(message: string, range: bc.Range) {
        onError("schema error", message, range)
        foundSchemaErrors = true
    }

    //console.log("DATASET DESER")

    const st = bc.createStreamTokenizer(
        parser,
        (message, range) => {
            onError("tokenizer", message, range)
        },
    )

    return p20.createArray([serializedDataset]).streamify().toUnsafeValue(
        null,
        st,
    )
}
