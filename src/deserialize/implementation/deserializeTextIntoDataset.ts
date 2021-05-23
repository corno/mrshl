import * as p from "pareto"
import * as path from "path"

import * as md from "../../API/types"
import * as sideEffects from "../../API/ParsingSideEffectsAPI"
import { DiagnosticSeverity } from "../../API/DiagnosticSeverity"

import { IDataset } from "../../dataset"

import { LoadDocumentDiagnostic, LoadDocumentDiagnosticType, DiagnosticCallback, FileError } from "../DeserializeTextSupportTypes"
import { IDeserializedDataset } from "../IDeserializedDataset"
import { MakeHTTPrequest } from "../MakeHTTPrequest"
import { SchemaHost } from "../SchemaHost"

import { deserializeDataset } from "./deserializeDataset"
import { deserializeSchemaFromStream, ExternalSchemaDeserializationError } from "./deserializeSchemaFromStream"
import { createFromURLSchemaDeserializer } from "./createFromURLSchemaDeserializer"

function validateDocumentAfterExternalSchemaResolution(
	schemaHost: SchemaHost,
	documentText: string,
	externalSchema: md.Schema | null,
	makeHTTPrequest: MakeHTTPrequest,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root[],
	createDataset: (
		schema: md.Schema,
	) => IDataset,
): p.IUnsafeValue<IDeserializedDataset, ExternalSchemaDeserializationError> {
	const schemaReferenceResolver = createFromURLSchemaDeserializer(
		schemaHost,
		7000,
		makeHTTPrequest,
		// (instanceValidationErrorMessage, range) => {
		// 	addDiagnostic(
		// 		diagnosticCallback,
		// 		"constraint validation",
		// 		instanceValidationErrorMessage,
		// 		DiagnosticSeverity.error,
		// 		range
		// 	)
		// }
	)

	const allSideEffects = sideEffectHandlers.slice(0)

	return deserializeDataset(
		documentText,
		schemaReferenceResolver,
		(internalSchemaSpecification, schemaAndSideEffects): IDeserializedDataset => {

			function createDeserializedDataset(
				schema: md.Schema,
			): IDeserializedDataset {
				return {
					dataset: createDataset(schema),
					internalSchemaSpecification: internalSchemaSpecification,
				}
			}
			if (externalSchema === null) {


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
			return createDeserializedDataset(externalSchema)
		},
		(): IDataset | null => {
			if (externalSchema === null) {
				addDiagnostic(
					diagnosticCallback,
					["structure", {
						message: "missing (valid) schema",
					}],
					DiagnosticSeverity.error,
				)
				return null
			}
			return createDataset(externalSchema)

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
	schemaHost: SchemaHost,
	documentText: string,
	filePath: string,
	makeHTTPRequest: MakeHTTPrequest,
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
			schemaHost,
			documentText,
			null,
			makeHTTPRequest,
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
					schemaHost,
					documentText,
					null,
					makeHTTPRequest,
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
						schemaHost,
						documentText,
						schemaAndSideEffects.schema,
						makeHTTPRequest,
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