/* eslint
    "max-classes-per-file": off,
*/

import * as p20 from "pareto-20"
import * as p from "pareto"
import * as astncore from "astn-core"
import * as astn from "astn"

import * as streamVal from "../../interfaces/streamingValidationAPI"

import { InternalSchemaSpecification, InternalSchemaSpecificationType } from "../../etc/interfaces/InternalSchemaSpecification"
import { SchemaAndSideEffects } from "../../interfaces/schemaPlugin/SchemaAndSideEffects"

import { createDeserializer as createMetaDataDeserializer } from "../../plugins/schemas/mrshl/metadata@0.1/deserialize"

import { createDatasetDeserializer } from "../../etc/deserialize/implementation/createDatasetDeserializer"

import { ExternalSchemaDeserializationError } from "../../interfaces/ExternalSchemaDeserializationError"
import { createInternalSchemaHandler } from "../../etc/deserialize/implementation/createInternalSchemaHandler"
import { createNOPSideEffects } from "./NOPSideEffects"
import { DeserializationDiagnostic, DeserializationDiagnosticType } from "./DeserializationDiagnostic"
import { IDeserializedDataset } from "../../etc/deserialize/IDeserializedDataset"
import { IDataset } from "../../etc/interfaces/dataset"
import { ResolveExternalSchema } from "./ResolveExternalSchema"
import { createSchemaAndSideEffectsFromStream } from "./createSchemaAndSideEffectsFromStream"
import { InternalSchemaDeserializationError } from "../../interfaces/schemaPlugin/internalSchemaDerializationError"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
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
    resolveExternalSchema: ResolveExternalSchema,
    onInternalSchema: (
        specification: InternalSchemaSpecification,
        schemaAndSideEffects: SchemaAndSideEffects<astn.ParserAnnotationData>,
    ) => IDeserializedDataset,
    onNoInternalSchema: () => IDataset | null,
    onError: (diagnostic: DeserializationDiagnostic, range: astn.Range) => void,
    onWarning: (diagnostic: DeserializationDiagnostic, range: astn.Range) => void,
    sideEffectsHandlers: streamVal.RootHandler<astn.ParserAnnotationData>[],
): p.IUnsafeValue<IDeserializedDataset, ExternalSchemaDeserializationError> {

    /*
    CSCH: I think it is better to not have the 2 callbacks: onInternalSchema and onNoInternalSchema,
    both their behaviour depends on the external schema.
    just add a 'externalSchema' parameter and then handle the logic in this function.
    */

    function createDiagnostic(type: DeserializationDiagnosticType): DeserializationDiagnostic {
        return {
            type: type,
        }
    }

    let internalSchemaSpecificationStart: null | astn.Range = null
    let foundSchemaErrors = false

    type InternalSchema = {
        specification: InternalSchemaSpecification
        schemaAndSideEffects: SchemaAndSideEffects<astn.ParserAnnotationData>
    }

    let internalSchema: InternalSchema | null = null
    const overheadComments: astn.CommentData[] = []
    const parserStack = astn.createParserStack<IDeserializedDataset, ExternalSchemaDeserializationError>(
        schemaStart => {
            internalSchemaSpecificationStart = schemaStart
            return createInternalSchemaHandler(
                (error, annotation) => {
                    onSchemaError(["internal schema", error], annotation.range)
                },
                createMetaDataDeserializer(
                    (error, annotation) => {
                        onSchemaError(["expect", error], annotation.range)
                    },
                    (errorMessage, annotation) => {
                        onSchemaError(["validation", { message: errorMessage }], annotation.range)
                    },
                    schema => {
                        if (schema !== null) {
                            internalSchema = {
                                schemaAndSideEffects: {
                                    schema: schema,
                                    createStreamingValidator: () => createNOPSideEffects(),
                                    //createAsyncValidator: () => createNOPBuilder(),
                                },
                                specification: [InternalSchemaSpecificationType.Embedded],
                            }
                        }
                    }
                ),
                $ => {
                    const value = ((): string => {
                        switch ($.data.type[0]) {
                            case "multiline": {
                                throw new Error("IMPLEMENT ME")
                            }
                            case "nonwrapped": {
                                return $.data.type[1].value
                            }
                            case "quoted": {
                                return $.data.type[1].value
                            }
                            default:
                                return assertUnreachable($.data.type[0])
                        }
                    })()
                    return createSchemaAndSideEffectsFromStream(resolveExternalSchema(value)).reworkAndCatch(
                        error => {
                            onSchemaError(["schema reference resolving", error], $.annotation.range)
                            return p.value(false)
                        },
                        schemaAndSideEffects => {
                            internalSchema = {
                                schemaAndSideEffects: schemaAndSideEffects,
                                specification: [InternalSchemaSpecificationType.Reference, { name: value }],
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
        (): astncore.ITreeBuilder<astn.ParserAnnotationData, IDeserializedDataset, ExternalSchemaDeserializationError> => {
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

            return astncore.createStackedParser(
                createDatasetDeserializer(
                    dataset.dataset.sync,
                    sideEffectsHandlers.map(h => h.node),
                    (message, annotation) => onError(createDiagnostic(["deserializer", { message: message }]), annotation.range),
                ),
                (error, annotation) => {
                    onError(createDiagnostic(["stacked", error]), annotation.range)
                },
                () => {
                    sideEffectsHandlers.forEach(h => {
                        h.onEnd({})
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
