import * as p from "pareto"
import * as path from "path"
import * as astn from "astn"

import * as streamVal from "../deserialize/interfaces/streamingValidationAPI"
import * as def from "../deserialize/interfaces/typedParserDefinitions"
import { DiagnosticSeverity } from "../deserialize/interfaces/DiagnosticSeverity"

import { IDataset } from "../deserialize/interfaces/dataset"

import { ResolveExternalSchema } from "./ResolveExternalSchema"
import { IDeserializedDataset } from "../deserialize/interfaces/IDeserializedDataset"

import { deserializeDataset } from "./deserializeDataset"
import { deserializeSchemaFromStream } from "./deserializeSchemaFromStream"
import { ContextSchemaData } from "./DeserializeASTNTextIntoDataset"
import { SchemaAndSideEffects } from "../deserialize/interfaces/schemaPlugin/SchemaAndSideEffects"
import { ExternalSchemaDeserializationError } from "../interfaces/ExternalSchemaDeserializationError"


import { SchemaSchemaError } from "./SchemaSchemaError"
import { DeserializationDiagnostic } from "./DeserializationDiagnostic"

function assertUnreachable<RT>(_x: never): RT {
	throw new Error("unreachable")
}


export type LoadDocumentDiagnosticType =
	| ["schema retrieval", {
		issue:
		| ["unknown retrieval error", { "description": string }]
		| ["validating schema file against internal schema"]
		| ["found both external and internal schema. ignoring internal schema"]
		| ["error in external schema", SchemaSchemaError]
		| ["no valid schema"]
		| ["missing schema"]
	}]
	| ["validation", {
		range: astn.Range
		message: string
	}]
	| ["structure", {
		message: "missing (valid) schema"
	}]
	| ["deserialization", {
		data: DeserializationDiagnostic
		range: astn.Range
	}]


export type LoadDocumentDiagnostic = {
	type: LoadDocumentDiagnosticType
	severity: DiagnosticSeverity
}

export type DiagnosticCallback = (diagnostic: LoadDocumentDiagnostic) => void


function validateDocumentAfterContextSchemaResolution(
	documentText: string,
	contextSchema: def.Schema | null,
	resolveExternalSchema: ResolveExternalSchema,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: streamVal.RootHandler<astn.ParserAnnotationData>[],
	createDataset: (
		schema: def.Schema,
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
				schema: def.Schema,
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
	)
}

export const schemaFileName = "schema.astn-schema"

export function deserializeTextIntoDataset(
	contextSchemaData: ContextSchemaData,
	documentText: string,
	resolveExternalSchema: ResolveExternalSchema,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: streamVal.RootHandler<astn.ParserAnnotationData>[],
	createInitialDataset: (
		schema: def.Schema,
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
					issue: error.problem === "missing schema" ? [ "missing schema"] : ["no valid schema"],
				}],
				DiagnosticSeverity.error,
			)
		}
		return p.value(null)
	}

	function validateDocumentAfter(
		schemaAndSideEffects: SchemaAndSideEffects<astn.ParserAnnotationData> | null
	) {
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