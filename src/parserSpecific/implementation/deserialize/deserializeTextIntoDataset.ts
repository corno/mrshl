import * as p from "pareto"
import * as p20 from "pareto-20"
import * as path from "path"
import * as astn from "astn"

import * as astncore from "astn-core"

import {
	IDataset,
	IDeserializedDataset,
} from "../../interfaces/Dataset"

import { ResolveExternalSchema, RetrievalError } from "../../interfaces/ResolveExternalSchema"

import { createDeserializer } from "./createDeserializer"
import { ExternalSchemaDeserializationError } from "../../interfaces/ExternalSchemaDeserializationError"


import { SchemaAndSideEffects } from "../../interfaces/SchemaAndSideEffects"
import { SchemaSchemaBuilder } from "../../interfaces"
import { LoadDocumentDiagnostic, LoadDocumentDiagnosticType } from "../../interfaces/LoadDocumentDiagnostic"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import { SchemaSchemaError } from "../../interfaces/SchemaSchemaError"


export function deserializeSchemaFromStream(
	schemaStream: p.IStream<string, null>,
	onError: (error: SchemaSchemaError, range: astn.Range) => void,
	getSchemaSchemaBuilder: (
		name: string,
	) => SchemaSchemaBuilder<astn.TokenizerAnnotationData> | null,
): p.IUnsafeValue<SchemaAndSideEffects<astn.TokenizerAnnotationData>, ExternalSchemaDeserializationError> {
	//console.log("FROM STRING")

	return schemaStream.tryToConsume<SchemaAndSideEffects<astn.TokenizerAnnotationData>, null>(
		null,
		createSchemaDeserializer(
			onError,
			getSchemaSchemaBuilder,
		),
	).mapError(
		() => {
			return p.value({ problem: "missing schema" })
		}
	)

	// schemaDeserializer.onData(serializedSchema)
	// return schemaDeserializer.onEnd(false, null).mapError(
	//     () => {
	//         return p.value("missing schema")
	//     }
	// )

}

function assertUnreachable<RT>(_x: never): RT {
	throw new Error("unreachable")
}

export type DiagnosticCallback = (diagnostic: LoadDocumentDiagnostic) => void

export type ContextSchemaData = {
	filePath: string
	getContextSchema: (dir: string, schemaFileName: string) => p.IUnsafeValue<p.IStream<string, null>, RetrievalError>
}
export const schemaFileName = "schema.astn-schema"

export function deserializeTextIntoDataset(
	contextSchemaData: ContextSchemaData,
	documentText: string,
	resolveExternalSchema: ResolveExternalSchema,
	onDiagnostic: DiagnosticCallback,
	sideEffectHandlers: astncore.RootHandler<astn.TokenizerAnnotationData>[],
	createInitialDataset: (
		schema: astncore.Schema,
	) => IDataset,
	getSchemaSchemaBuilder: (
		name: string,
	) => SchemaSchemaBuilder<astn.TokenizerAnnotationData> | null,
): p.IUnsafeValue<IDeserializedDataset, null> {


	let diagnosticFound = false
	const dc: DiagnosticCallback = (
		diagnostic: LoadDocumentDiagnostic
	) => {
		diagnosticFound = true
		return onDiagnostic(diagnostic)
	}


	function addDiagnostic(
		type: LoadDocumentDiagnosticType,
		severity: astncore.DiagnosticSeverity,
	) {
		dc({
			type: type,
			severity: severity,
		})
	}

	function validateThatErrorsAreFound(error: ExternalSchemaDeserializationError) {
		if (!diagnosticFound) {
			addDiagnostic(
				['schema retrieval', {
					issue: error.problem === "missing schema" ? ["missing schema"] : ["no valid schema"],
				}],
				astncore.DiagnosticSeverity.error,
			)
		}
		return p.value(null)
	}

	function validateDocumentAfter(
		schemaAndSideEffects: SchemaAndSideEffects<astn.TokenizerAnnotationData> | null
	) {
		function validateDocumentAfterContextSchemaResolution(
			documentText: string,
			contextSchema: astncore.Schema | null,
			resolveExternalSchema: ResolveExternalSchema,
			onDiagnostic: DiagnosticCallback,
			sideEffectHandlers: astncore.RootHandler<astn.TokenizerAnnotationData>[],
			createDataset: (
				schema: astncore.Schema,
			) => IDataset,
			getSchemaSchemaBuilder: (
				name: string,
			) => SchemaSchemaBuilder<astn.TokenizerAnnotationData> | null,
		): p.IUnsafeValue<IDeserializedDataset, ExternalSchemaDeserializationError> {

			const allSideEffects = sideEffectHandlers.slice(0)


			function addDiagnostic(
				type: LoadDocumentDiagnosticType,
				severity: astncore.DiagnosticSeverity,
			) {
				onDiagnostic({
					type: type,
					severity: severity,
				})
			}

			const deser = createDeserializer(
				resolveExternalSchema,
				(internalSchemaSpecification, schemaAndSideEffects): IDeserializedDataset => {

					function createDeserializedDataset(
						schema: astncore.Schema,
					): IDeserializedDataset {
						return {
							dataset: createDataset(schema),
							internalSchemaSpecification: internalSchemaSpecification,
						}
					}
					if (contextSchema === null) {


						allSideEffects.push(schemaAndSideEffects.createStreamingValidator((
							message,
							annotation,
							severity,
						) => {
							addDiagnostic(
								["validation", { range: annotation.range, message: message }],
								severity,
							)
						}))
						return createDeserializedDataset(schemaAndSideEffects.schema)
					}

					addDiagnostic(
						["schema retrieval", {
							issue: ["found both external and internal schema. ignoring internal schema"],
						}],
						astncore.DiagnosticSeverity.warning,
					)
					return createDeserializedDataset(contextSchema)
				},
				(): IDataset | null => {
					if (contextSchema === null) {
						addDiagnostic(
							["structure", {
								message: "missing (valid) schema",
							}],
							astncore.DiagnosticSeverity.error,
						)
						return null
					}
					return createDataset(contextSchema)

				},
				(errorDiagnostic, range, severity) => {
					addDiagnostic(
						["deserialization", {
							data: errorDiagnostic,
							range: range,
						}],
						severity,
					)
				},
				allSideEffects,
				getSchemaSchemaBuilder,
			)
			return p20.createArray([documentText]).streamify().tryToConsume(
				null,
				deser,
			).mapResult(res => {
				// overheadComments.forEach(ohc => {
				//     res.dataset.build.documentComments.addComment(ohc.comment, ohc.type === "block" ? ["block"] : ["line"])
				// })
				return p.value(res)
			})
		}
		return validateDocumentAfterContextSchemaResolution(
			documentText,
			schemaAndSideEffects !== null ? schemaAndSideEffects.schema : null,
			resolveExternalSchema,
			dc,
			schemaAndSideEffects === null ? sideEffectHandlers : sideEffectHandlers.concat([schemaAndSideEffects.createStreamingValidator(
				(
					message,
					annotation,
					severity
				) => {
					addDiagnostic(
						["validation", {
							range: annotation.range,
							message: message,
						}],
						severity,
					)
				}
			)]),
			createInitialDataset,
			getSchemaSchemaBuilder,
		).mapError(validateThatErrorsAreFound)
	}

	const basename = path.basename(contextSchemaData.filePath)
	const dir = path.dirname(contextSchemaData.filePath)
	if (basename === schemaFileName) {
		//don't validate the schema against itself
		dc({
			type: ["schema retrieval", {
				issue: ["validating schema file against internal schema"],
			}],
			severity: astncore.DiagnosticSeverity.warning,
		})

		return validateDocumentAfter(null)
	}
	return contextSchemaData.getContextSchema(
		dir,
		schemaFileName,
	).rework(
		error => {
			switch (error[0]) {
				case "not found": {
					//const $ = error[1]
					return validateDocumentAfter(null)

				}
				case "other": {
					const $ = error[1]
					//something else went wrong
					addDiagnostic(
						['schema retrieval', {
							issue: ['unknown retrieval error', { description: $.description }],
						}],
						astncore.DiagnosticSeverity.error,
					)
					return p.value(null)
				}
				default:
					return assertUnreachable(error[0])
			}
		},
		schemaStream => {

			return deserializeSchemaFromStream(
				schemaStream,
				(error, _range) => {
					dc({
						type: ["schema retrieval", {
							issue: ["error in external schema", error],
						}],
						severity: astncore.DiagnosticSeverity.error,
					})
				},
				getSchemaSchemaBuilder,
			).mapError(validateThatErrorsAreFound).try(
				schemaAndSideEffects => {

					return validateDocumentAfter(schemaAndSideEffects)
				}
			)
		},
	)
}