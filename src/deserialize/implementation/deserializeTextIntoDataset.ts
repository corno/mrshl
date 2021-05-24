import * as p from "pareto"
import * as path from "path"

import * as md from "../../API/types"
import * as sideEffects from "../../API/ParsingSideEffectsAPI"
import { DiagnosticSeverity } from "../../API/DiagnosticSeverity"

import { IDataset } from "../../dataset"

import { LoadDocumentDiagnostic, LoadDocumentDiagnosticType, DiagnosticCallback, FileError } from "../DeserializeTextSupportTypes"
import { IDeserializedDataset } from "../IDeserializedDataset"

import { deserializeDataset } from "./deserializeDataset"
import { deserializeSchemaFromStream, ExternalSchemaDeserializationError } from "./deserializeSchemaFromStream"
import { SchemaAndSideEffects } from "../../API/CreateSchemaAndSideEffects"
import { ExternalSchemaResolvingError } from "../../API/SchemaErrors"

function validateDocumentAfterExternalSchemaResolution(
	documentText: string,
	contextSchema: md.Schema | null,
	resolveExternalSchema: (id: string) => p.IUnsafeValue<SchemaAndSideEffects, ExternalSchemaResolvingError>,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root[],
	createDataset: (
		schema: md.Schema,
	) => IDataset,
): p.IUnsafeValue<IDeserializedDataset, ExternalSchemaDeserializationError> {

	const allSideEffects = sideEffectHandlers.slice(0)

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
					range,
					severity,
				) => {
					addDiagnostic(
						diagnosticCallback,
						["validation", { range: range, message: message }],
						severity,
					)
				}))
				return createDeserializedDataset(schemaAndSideEffects.schema)
			}

			addDiagnostic(
				diagnosticCallback,
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
					diagnosticCallback,
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
				diagnosticCallback,
				["deserialization", {
					data: errorDiagnostic,
					range: range,
				}],
				DiagnosticSeverity.error,
			)
		},
		(warningDiagnostic, range) => {
			addDiagnostic(
				diagnosticCallback,
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

function addDiagnostic(
	callback: DiagnosticCallback,
	type: LoadDocumentDiagnosticType,
	severity: DiagnosticSeverity,
) {
	callback({
		type: type,
		severity: severity,
	})
}

export const schemaFileName = "schema.astn-schema"

export function deserializeTextIntoDataset(
	documentText: string,
	filePath: string,
	resolveExternalSchema: (id: string) => p.IUnsafeValue<SchemaAndSideEffects, ExternalSchemaResolvingError>,
	readSchemaFile: (dir: string, schemaFileName: string) => p.IUnsafeValue<p.IStream<string, null>, FileError>,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root[],
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

	function validateThatErrorsAreFound(error: ExternalSchemaDeserializationError) {
		if (!diagnosticFound) {
			addDiagnostic(
				dc,
				['schema retrieval', {
					issue: [error.problem],
				}],
				DiagnosticSeverity.error,
			)
		}
		return p.value(null)
	}

	const basename = path.basename(filePath)
	const dir = path.dirname(filePath)
	if (basename === schemaFileName) {
		//don't validate the schema against itself
		dc({
			type: ["schema retrieval", {
				issue: ["validating schema file against internal schema"],
			}],
			severity: DiagnosticSeverity.warning,
		})

		return validateDocumentAfterExternalSchemaResolution(
			documentText,
			null,
			resolveExternalSchema,
			dc,
			sideEffectHandlers,
			createInitialDataset,
		).mapError(validateThatErrorsAreFound)
	}
	return readSchemaFile(
		dir,
		schemaFileName,
	).rework(
		error => {
			if (error === FileError.FileNotFound) {

				return validateDocumentAfterExternalSchemaResolution(
					documentText,
					null,
					resolveExternalSchema,
					dc,
					sideEffectHandlers,
					createInitialDataset,
				).mapError(validateThatErrorsAreFound)
			} else {
				//something else went wrong
				addDiagnostic(
					dc,
					['schema retrieval', {
						issue: ['unknown file system error'],
					}],
					DiagnosticSeverity.error,
				)
				return p.value(null)
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

					return validateDocumentAfterExternalSchemaResolution(
						documentText,
						schemaAndSideEffects.schema,
						resolveExternalSchema,
						dc,
						sideEffectHandlers.concat([schemaAndSideEffects.createAdditionalValidator(
							(
								message,
								range,
								severity
							) => {
								addDiagnostic(
									dc,
									["validation", {
										range: range,
										message: message,
									}],
									severity,
								)
							}
						)]),
						createInitialDataset,
					).mapError(validateThatErrorsAreFound)
				}
			)
		},
	)
}