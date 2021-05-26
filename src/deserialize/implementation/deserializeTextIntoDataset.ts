import * as p from "pareto"
import * as path from "path"
import * as astn from "astn"

import * as md from "../../API/types"
import * as sideEffects from "../../API/ParsingSideEffectsAPI"
import { DiagnosticSeverity } from "../../API/DiagnosticSeverity"

import { IDataset } from "../../dataset"

import { LoadDocumentDiagnostic, LoadDocumentDiagnosticType, DiagnosticCallback, ResolveExternalSchema } from "../DeserializeTextSupportTypes"
import { IDeserializedDataset } from "../IDeserializedDataset"

import { deserializeDataset } from "./deserializeDataset"
import { deserializeSchemaFromStream, ExternalSchemaDeserializationError } from "./deserializeSchemaFromStream"
import { ContextSchemaData } from "../DeserializeASTNTextIntoDataset"
import { SchemaAndSideEffects } from "../../API/CreateSchemaAndSideEffects"

function assertUnreachable<RT>(_x: never): RT {
	throw new Error("unreachable")
}

function validateDocumentAfterContextSchemaResolution(
	documentText: string,
	contextSchema: md.Schema | null,
	resolveExternalSchema: ResolveExternalSchema,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root<astn.ParserAnnotationData>[],
	createDataset: (
		schema: md.Schema,
	) => IDataset,
): p.IUnsafeValue<IDeserializedDataset, ExternalSchemaDeserializationError> {

	const allSideEffects = sideEffectHandlers.slice(0)


	function addDiagnostic(
		type: LoadDocumentDiagnosticType,
		severity: DiagnosticSeverity,
	) {
		diagnosticCallback({
			type: type,
			severity: severity,
		})
	}
	return deserializeDataset(
		documentText,
		resolveExternalSchema,
		(internalSchemaSpecification, schemaAndSideEffects): IDeserializedDataset => {

			function createDeserializedDataset(
				schema: md.Schema,
			): IDeserializedDataset {
				return {
					dataset: createDataset(schema),
					internalSchemaSpecification: internalSchemaSpecification,
				}
			}
			if (contextSchema === null) {


				allSideEffects.push(schemaAndSideEffects.createAdditionalValidator((
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
				DiagnosticSeverity.warning,
			)
			return createDeserializedDataset(contextSchema)
		},
		(): IDataset | null => {
			if (contextSchema === null) {
				addDiagnostic(
					["structure", {
						message: "missing (valid) schema",
					}],
					DiagnosticSeverity.error,
				)
				return null
			}
			return createDataset(contextSchema)

		},
		(errorDiagnostic, range) => {
			addDiagnostic(
				["deserialization", {
					data: errorDiagnostic,
					range: range,
				}],
				DiagnosticSeverity.error,
			)
		},
		(warningDiagnostic, range) => {
			addDiagnostic(
				["deserialization", {
					data: warningDiagnostic,
					range: range,
				}],
				DiagnosticSeverity.warning,
			)
		},
		allSideEffects,
	)
}

export const schemaFileName = "schema.astn-schema"

export function deserializeTextIntoDataset(
	contextSchemaData: ContextSchemaData,
	documentText: string,
	resolveExternalSchema: ResolveExternalSchema,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root<astn.ParserAnnotationData>[],
	createInitialDataset: (
		schema: md.Schema,
	) => IDataset,
): p.IUnsafeValue<IDeserializedDataset, null> {
	let diagnosticFound = false
	const dc: DiagnosticCallback = (
		diagnostic: LoadDocumentDiagnostic
	) => {
		diagnosticFound = true
		return diagnosticCallback(diagnostic)
	}


	function addDiagnostic(
		type: LoadDocumentDiagnosticType,
		severity: DiagnosticSeverity,
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
					issue: [error.problem],
				}],
				DiagnosticSeverity.error,
			)
		}
		return p.value(null)
	}

	function validateDocumentAfter(
		schemaAndSideEffects: SchemaAndSideEffects | null
	) {
		return validateDocumentAfterContextSchemaResolution(
			documentText,
			schemaAndSideEffects !== null ? schemaAndSideEffects.schema : null,
			resolveExternalSchema,
			dc,
			schemaAndSideEffects === null ? sideEffectHandlers : sideEffectHandlers.concat([schemaAndSideEffects.createAdditionalValidator(
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
			severity: DiagnosticSeverity.warning,
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
						DiagnosticSeverity.error,
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
						severity: DiagnosticSeverity.error,
					})
				},
			).mapError(validateThatErrorsAreFound).try(
				schemaAndSideEffects => {

					return validateDocumentAfter(schemaAndSideEffects)
				}
			)
		},
	)
}