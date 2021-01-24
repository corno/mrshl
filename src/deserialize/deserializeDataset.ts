import * as bc from "bass-clarinet-typed"
import * as sideEffects from "../SideEffectsAPI"
import { createDatasetDeserializer } from "./createDatasetDeserializer"
import * as p20 from "pareto-20"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../schemas"
import { IDataset } from "../dataset"
import { InternalSchemaSpecification, InternalSchemaSpecificationType } from "../syncAPI"
import { createDeserializer as createMetaDataDeserializer } from "../schemas/metadata@0.1/deserialize"
import { SchemaError } from "./deserializeSchemaFromStream"


export type DeserializeDiagnosticType =
    | ["structure", {
        message: "ignoring invalid internal schema"
    }]
    | ["expect", {
        message: string
    }]
    | ["deserializer", {
        message: string
    }]
    | ["X", {
        message: string
    }]
    | ["parser", {
        message: string
    }]
    | ["schema error", {
        message: string
    }]
    | ["tokenizer", {
        message: string
    }]

export type DeserializeDiagnostic = {
    type: DeserializeDiagnosticType
    range: bc.Range
}

function createNoOperationPropertyHandler(
    _key: string,
    //propertyData: bc.PropertyData,
    _preData: bc.ContextData,
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
        onValue: () => createNoOperationValueHandler(),
    }
}

function createNoOperationArrayHandler(_beginRange: bc.Range): bc.ArrayHandler {
    return {
        element: () => () => createNoOperationValueHandler(),
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
            return p.result(createNoOperationRequiredValueHandler())
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
 * this type has information about how the dataset was serialized in regards to compactness and schema specification
 */
export type IDeserializedDataset = {
    internalSchemaSpecification: InternalSchemaSpecification
    compact: boolean
    dataset: IDataset
}

/**
 * this function returns a promise to a deserialized dataset and the promise is resolved when the validation has been completed
 * @param serializedDataset
 * @param schemaReferenceResolver if the document contains a reference to a schema, this callback resolves the schema
 * @param onInternalSchema if the document contains a schema (either reference or embedded), this callback is used to create the dataset
 * @param onNoInternalSchema if the document does not contain a schema, this callback is used to create the dataset
 * @param onError
 * @param onWarning
 * @param sideEffectsHandlers these handlers will be called during the deserialization.
 * Can be used to create additional errors and warnings about the serialized document. For example missing properties or invalid formatting
 */
export function deserializeDataset(
    serializedDataset: string,
    schemaReferenceResolver: (
        reference: string,
    ) => p.IUnsafeValue<SchemaAndSideEffects, string>,
    onInternalSchema: (
        specification: InternalSchemaSpecification,
        schemaAndSideEffects: SchemaAndSideEffects,
        compact: boolean
    ) => IDeserializedDataset,
    onNoInternalSchema: () => IDataset | null,
    onError: (diagnostic: DeserializeDiagnostic) => void,
    onWarning: (diagnostic: DeserializeDiagnostic) => void,
    sideEffectsHandlers: sideEffects.Root[],
): p.IUnsafeValue<IDeserializedDataset, SchemaError> {

    /*
    CSCH: I think it is better to not have the 2 callbacks: onInternalSchema and onNoInternalSchema,
    both their behaviour depends on the external schema.
    just add a 'externalSchema' parameter and then handle the logic in this function.
    */

    function createDiagnostic(type: DeserializeDiagnosticType, range: bc.Range): DeserializeDiagnostic {
        return {
            type: type,
            range: range,
        }
    }

    function createDSD(dataset: IDeserializedDataset, isCompact: boolean): bc.ParserEventConsumer<IDeserializedDataset, SchemaError> {

        const context = new bc.ExpectContext(
            (message, range) => onError(createDiagnostic(["expect", { message: message }], range)),
            (message, range) => onWarning(createDiagnostic(["expect", { message: message }], range)),
            (_range, key, contextData) => () => createNoOperationPropertyHandler(key, contextData),
            () => () => createNoOperationValueHandler(),
            bc.Severity.warning,
            bc.OnDuplicateEntry.ignore
        )
        return bc.createStackedDataSubscriber(
            createDatasetDeserializer(
                context,
                dataset.dataset.sync,
                isCompact,
                sideEffectsHandlers.map(h => h.node),
                (message, range) => onError(createDiagnostic(["deserializer", { message: message }], range)),
            ),
            error => {
                onError(createDiagnostic(["X", { message: error.rangeLessMessage }], error.range))
            },
            () => {
                sideEffectsHandlers.forEach(h => {
                    h.onEnd()
                })
                return p.success(dataset)
            }
        )
    }

    let internalSchemaSpecificationStart: null | bc.Range = null
    let foundSchemaErrors = false
    let internalSchema: InternalSchema | null = null
    const parser = bc.createParser<IDeserializedDataset, SchemaError>(
        schemaStart => {
            internalSchemaSpecificationStart = schemaStart
            return bc.createStackedDataSubscriber(
                {
                    onValue: () => {
                        return {
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
                        }
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
        (compact: bc.Range | null): bc.ParserEventConsumer<IDeserializedDataset, SchemaError> => {
            if (internalSchemaSpecificationStart && internalSchema === null && !foundSchemaErrors) {
                console.error("NO SCHEMA AND NO ERROR")
                //throw new Error("Unexpected: no schema errors and no schema")
            }
            const dataset: IDeserializedDataset | null = (internalSchema === null)
                ? ((): IDeserializedDataset | null => {
                    const ds = onNoInternalSchema()
                    if (ds === null) {
                        return null
                    }
                    return {
                        dataset: ds,
                        internalSchemaSpecification: [InternalSchemaSpecificationType.None],
                        compact: compact !== null,
                    }
                })() : onInternalSchema(internalSchema.specification, internalSchema.schemaAndSideEffects, compact !== null)

            if (dataset === null) {
                return {
                    onData: () => {
                        //
                        return p.result(false)
                    },
                    onEnd: () => {
                        return p.error({
                            problem: "no valid schema",
                        })
                    },
                }
            }
            if (internalSchemaSpecificationStart) {
                if (internalSchema === null) {
                    onWarning(createDiagnostic(
                        ["structure", {
                            message: "ignoring invalid internal schema",
                        }],
                        internalSchemaSpecificationStart,
                    ))
                }
            }
            return createDSD(dataset, compact !== null)
        },

        (message, range) => {
            onError(createDiagnostic(["parser", { message: message }], range))
        },
        () => {
            return p.result(false)
        }
    )
    function onSchemaError(message: string, range: bc.Range) {
        onError(createDiagnostic(["schema error", { message: message }], range))
        foundSchemaErrors = true
    }

    //console.log("DATASET DESER")

    const st = bc.createStreamPreTokenizer(
        bc.createTokenizer(parser),
        (message, range) => {
            onError(createDiagnostic(["tokenizer", { message: message }], range))
        },
    )

    return p20.createArray([serializedDataset]).streamify().consume(
        null,
        st,
    )
}
