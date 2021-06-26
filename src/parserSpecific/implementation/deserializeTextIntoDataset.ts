import * as p from "pareto"
import * as path from "path"
import * as astn from "astn"

import * as astncore from "astn-core"

import {
	 IDataset,
	 IDeserializedDataset,
	 } from "../interfaces/Dataset"

import { ResolveExternalSchema } from "../interfaces/ResolveExternalSchema"

import { deserializeDataset } from "./deserializeDataset"
import { deserializeSchemaFromStream } from "./deserializeSchemaFromStream"
import { ContextSchemaData } from "./DeserializeASTNTextIntoDataset"
import { ExternalSchemaDeserializationError } from "../interfaces/ExternalSchemaDeserializationError"


import { SchemaAndSideEffects } from "../interfaces/SchemaAndSideEffects"
import { SchemaSchemaBuilder } from "../interfaces"
import { LoadDocumentDiagnostic, LoadDocumentDiagnosticType } from "../interfaces/LoadDocumentDiagnostic"

function assertUnreachable<RT>(_x: never): RT {
	throw new Error("unreachable")
}

export type DiagnosticCallback = (diagnostic: LoadDocumentDiagnostic) => void


function validateDocumentAfterContextSchemaResolution(
	documentText: string,
	contextSchema: astncore.Schema | null,
	resolveExternalSchema: ResolveExternalSchema,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: astncore.RootHandler<astn.ParserAnnotationData>[],
	createDataset: (
		schema: astncore.Schema,
	) => IDataset,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<astn.ParserAnnotationData> | null,
): p.IUnsafeValue<IDeserializedDataset, ExternalSchemaDeserializationError> {

	const allSideEffects = sideEffectHandlers.slice(0)


	function addDiagnostic(
		type: LoadDocumentDiagnosticType,
		severity: astncore.DiagnosticSeverity,
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
}

export const schemaFileName = "schema.astn-schema"

export function deserializeTextIntoDataset(
	contextSchemaData: ContextSchemaData,
	documentText: string,
	resolveExternalSchema: ResolveExternalSchema,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: astncore.RootHandler<astn.ParserAnnotationData>[],
	createInitialDataset: (
		schema: astncore.Schema,
	) => IDataset,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<astn.ParserAnnotationData> | null,
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
					issue: error.problem === "missing schema" ? [ "missing schema"] : ["no valid schema"],
				}],
				astncore.DiagnosticSeverity.error,
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