/* eslint
    "max-classes-per-file": off,
*/

import * as astn from "astn"
import * as sideEffects from "../API/ParsingSideEffectsAPI"
import { createDatasetDeserializer } from "./createDatasetDeserializer"
import * as p20 from "pareto-20"
import * as p from "pareto"
import { printInternalSchemaDeserializationError } from "../schemas"
import { IDataset } from "../dataset"
import { InternalSchemaSpecification, InternalSchemaSpecificationType } from "../API/syncAPI"
import { createDeserializer as createMetaDataDeserializer } from "../schemas/mrshl/metadata@0.1/deserialize"
import { ExternalSchemaDeserializationError } from "./deserializeSchemaFromStream"
import { createInternalSchemaHandler } from "./createInternalSchemaHandler"
import { SchemaAndSideEffects } from "../API/SchemaAndSideEffects"
import { createNOPSideEffects } from "./NOPSideEffects"
import { InternalSchemaDeserializationError, SchemaReferenceResolvingError } from "../API/SchemaErrors"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export type DeserializeDiagnosticType =
    | ["structure", {
        message: "ignoring invalid internal schema"
    }]
    | ["expect", astn.ExpectError]
    | ["deserializer", {
        message: string
    }]
    | ["stacked", astn.StackedDataError]
    | ["parsing", astn.ParsingError]
    | ["schema error", InternalSchemaDeserializationError]

export type DeserializeDiagnostic = {
    type: DeserializeDiagnosticType
}

export function printDeserializeDiagnostic($: DeserializeDiagnostic): string {
    switch ($.type[0]) {
        case "stacked": {
            const $$ = $.type[1]
            return $$[0]
        }
        case "deserializer": {
            const $$ = $.type[1]
            return $$.message
        }
        case "expect": {
            const $$ = $.type[1]
            return astn.printExpectError($$)
        }
        case "parsing": {
            const $$ = $.type[1]
            return astn.printParsingError($$)
        }
        case "schema error": {
            const $$ = $.type[1]
            return printInternalSchemaDeserializationError($$)
        }
        case "structure": {
            const $$ = $.type[1]
            return $$.message
        }
        default:
            return assertUnreachable($.type[0])
    }
}

function createNoOperationValueHandler(): astn.ValueHandler {
    return {
        array: _range => {
            return {
                element: () => () => createNoOperationValueHandler(),
                end: _endData => {
                    //registerCodeCompletionGenerators.register(endData.range, null, null)
                },
            }
        },
        object: _range => {
            return {
                property: (_key, _keyData) => {
                    //registerCodeCompletionGenerators.register(keyData.keyRange, null, null)
                    return p.value(createNoOperationRequiredValueHandler())
                },
                end: _endData => {
                    //registerCodeCompletionGenerators.register(endData.range, null, null)
                },
            }
        },
        simpleValue: (_value, _stringData) => {
            //registerCodeCompletionGenerators.register(stringData.range, null, null)
            return p.value(false)
        },
        taggedUnion: () => {
            //registerCodeCompletionGenerators.register(tuData.startRange, null, null)
            //registerCodeCompletionGenerators.register(tuData.optionRange, null, null)
            return {
                option: () => createNoOperationRequiredValueHandler(),
                missingOption: () => {
                    //
                },
                end: () => {
                    //
                },
            }
        },
    }
}

function createNoOperationRequiredValueHandler(): astn.RequiredValueHandler {
    return {
        onMissing: () => {
            //
        },
        onValue: () => createNoOperationValueHandler(),
    }
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
    ) => p.IUnsafeValue<SchemaAndSideEffects, SchemaReferenceResolvingError>,
    onInternalSchema: (
        specification: InternalSchemaSpecification,
        schemaAndSideEffects: SchemaAndSideEffects,
    ) => IDeserializedDataset,
    onNoInternalSchema: () => IDataset | null,
    onError: (diagnostic: DeserializeDiagnostic, range: astn.Range) => void,
    onWarning: (diagnostic: DeserializeDiagnostic, range: astn.Range) => void,
    sideEffectsHandlers: sideEffects.Root[],
): p.IUnsafeValue<IDeserializedDataset, ExternalSchemaDeserializationError> {

    /*
    CSCH: I think it is better to not have the 2 callbacks: onInternalSchema and onNoInternalSchema,
    both their behaviour depends on the external schema.
    just add a 'externalSchema' parameter and then handle the logic in this function.
    */

    function createDiagnostic(type: DeserializeDiagnosticType): DeserializeDiagnostic {
        return {
            type: type,
        }
    }

    let internalSchemaSpecificationStart: null | astn.Range = null
    let foundSchemaErrors = false
    let internalSchema: InternalSchema | null = null
    const overheadComments: astn.CommentData[] = []
    const parserStack = astn.createParserStack<IDeserializedDataset, ExternalSchemaDeserializationError>(
        schemaStart => {
            internalSchemaSpecificationStart = schemaStart
            return createInternalSchemaHandler(
                (error, range) => {
                    onSchemaError(["internal schema", error], range)
                },
                createMetaDataDeserializer(
                    (error, range) => {
                        onSchemaError(["expect", error], range)
                    },
                    (errorMessage, range) => {
                        onSchemaError(["validation", { message: errorMessage }], range)
                    },
                    schema => {
                        if (schema !== null) {
                            internalSchema = {
                                schemaAndSideEffects: {
                                    schema: schema,
                                    createAdditionalValidator: () => createNOPSideEffects(),
                                },
                                specification: [InternalSchemaSpecificationType.Embedded],
                            }
                        }
                    }
                ),
                (range, data) => {
                    return schemaReferenceResolver(data.value).reworkAndCatch(
                        error => {
                            onSchemaError(["schema reference resolving", error], range)
                            return p.value(false)
                        },
                        schemaAndSideEffects => {
                            internalSchema = {
                                schemaAndSideEffects: schemaAndSideEffects,
                                specification: [InternalSchemaSpecificationType.Reference, { name: data.value }],
                            }
                            return p.value(false)

                        },
                    )
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
        (): astn.ParserEventConsumer<IDeserializedDataset, ExternalSchemaDeserializationError> => {
            if (internalSchemaSpecificationStart && internalSchema === null && !foundSchemaErrors) {
                console.error("NO SCHEMA AND NO ERROR")
                //throw new Error("Unexpected: no schema errors and no schema")
            }
            const dataset: IDeserializedDataset | null = (internalSchema === null)
                ? ((): IDeserializedDataset | null => { //no internal schema
                    const ds = onNoInternalSchema()
                    if (ds === null) {
                        return null
                    }
                    return {
                        dataset: ds,
                        internalSchemaSpecification: [InternalSchemaSpecificationType.None],
                    }
                })()
                : onInternalSchema(internalSchema.specification, internalSchema.schemaAndSideEffects) //internal schema

            if (dataset === null) {
                return {
                    onData: () => {
                        //
                        return p.value(false)
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
                    onWarning(
                        createDiagnostic(
                            ["structure", {
                                message: "ignoring invalid internal schema",
                            }],
                        ),
                        internalSchemaSpecificationStart,
                    )
                }
            }

            const context = new astn.ExpectContext(
                (issue, range) => onError(createDiagnostic(["expect", issue]), range),
                (issue, range) => onWarning(createDiagnostic(["expect", issue]), range),
                (_range, _key, _contextData) => () => createNoOperationValueHandler(),
                () => () => createNoOperationValueHandler(),
                astn.Severity.warning,
                astn.OnDuplicateEntry.ignore
            )
            return astn.createStackedDataSubscriber(
                createDatasetDeserializer(
                    context,
                    dataset.dataset.sync,
                    sideEffectsHandlers.map(h => h.node),
                    (message, range) => onError(createDiagnostic(["deserializer", { message: message }]), range),
                ),
                (error, range) => {
                    onError(createDiagnostic(["stacked", error]), range)
                },
                () => {
                    sideEffectsHandlers.forEach(h => {
                        h.onEnd()
                    })
                    return p.success(dataset)
                }
            )
        },
        (error, range) => {
            onError(createDiagnostic(["parsing", error]), range)
        },
        overheadToken => {
            switch (overheadToken.type[0]) {
                case astn.OverheadTokenType.Comment: {
                    const $ = overheadToken.type[1]
                    overheadComments.push($)
                    break
                }
                case astn.OverheadTokenType.NewLine: {
                    break
                }
                case astn.OverheadTokenType.WhiteSpace: {
                    break
                }
                default:
                    assertUnreachable(overheadToken.type[0])
            }
            return p.value(false)
        }
    )
    function onSchemaError(error: InternalSchemaDeserializationError, range: astn.Range) {
        onError(createDiagnostic(["schema error", error]), range)
        foundSchemaErrors = true
    }

    return p20.createArray([serializedDataset]).streamify().tryToConsume(
        null,
        parserStack,
    ).mapResult(res => {
        overheadComments.forEach(ohc => {
            res.dataset.sync.documentComments.addComment(ohc.comment, ohc.type === "block" ? ["block"] : ["line"])
        })
        return p.value(res)
    })
}
