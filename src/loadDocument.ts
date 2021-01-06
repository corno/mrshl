import * as path from "path"
import * as md from "./types"
import { createFromURLSchemaDeserializer, deserializeDataset, deserializeSchemaFromStream, IDeserializedDataset } from "./deserialize"
import * as sideEffects from "./SideEffectsAPI"
import * as bc from "bass-clarinet-typed"
import * as p from "pareto"
import { IDataset } from "./dataset"
import { MakeHTTPrequest } from "./makeHTTPrequest"

export enum DiagnosticSeverity {
	warning,
	error
}

type Diagnostic = {
	source: string
	severity: DiagnosticSeverity
	message: string
	range: bc.Range | null
}

type DiagnosticCallback = (diagnostic: Diagnostic) => void

function validateDocumentAfterExternalSchemaResolution(
	documentText: string,
	externalSchema: md.Schema | null,
	makeHTTPrequest: MakeHTTPrequest,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root[],
	createDataset: (
		schema: md.Schema,
	) => IDataset,
): p.IUnsafeValue<IDeserializedDataset, string> {
	const schemaReferenceResolver = createFromURLSchemaDeserializer(
		'www.astn.io',
		'/dev/schemas/',
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
		(internalSchemaSpecification, schemaAndSideEffects, compact): IDeserializedDataset => {

			function createDeserializedDataset(
				schema: md.Schema,
				compact: boolean,
			): IDeserializedDataset {
				return {
					dataset: createDataset(schema),
					internalSchemaSpecification: internalSchemaSpecification,
					compact: compact,
				}
			}
			if (externalSchema === null) {


				allSideEffects.push(schemaAndSideEffects.createSideEffects((
					message,
					range,
					severity,
				) => {
					addDiagnostic(
						diagnosticCallback,
						"validation",
						message,
						severity,
						range,
					)
				}))
				return createDeserializedDataset(schemaAndSideEffects.schema, compact)
			}

			addDiagnostic(
				diagnosticCallback,
				"schema retrieval",
				"found both external and internal schema. ignoring internal schema",
				DiagnosticSeverity.warning,
				null,
			)
			return createDeserializedDataset(externalSchema, compact)
		},
		(): IDataset | null => {
			if (externalSchema === null) {
				addDiagnostic(
					diagnosticCallback,
					"structure",
					"missing (valid) schema",
					DiagnosticSeverity.error,
					null,
				)
				return null
			}
			return createDataset(externalSchema)

		},
		(source, errorMessage, range) => {
			addDiagnostic(
				diagnosticCallback,
				source,
				errorMessage,
				DiagnosticSeverity.error,
				range,
			)
		},
		(source, warningMessage, range) => {
			addDiagnostic(
				diagnosticCallback,
				source,
				warningMessage,
				DiagnosticSeverity.warning,
				range
			)
		},
		allSideEffects,
	)
}

function addDiagnostic(
	callback: DiagnosticCallback,
	source: string,
	message: string,
	severity: DiagnosticSeverity,
	range: bc.Range | null,
) {
	callback({
		source: source,
		severity: severity,
		message: message,
		range: range,
	})
}

export const schemaFileName = "schema.astn-schema"

export enum FileError {
	FileNotFound,
	UnknownError,
}

export function loadDocument(
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
		diagnostic: Diagnostic
	) => {
		diagnosticFound = true
		return diagnosticCallback(diagnostic)
	}

	function validateThatErrorsAreFound(errorMessage: string) {
		if (!diagnosticFound) {
			addDiagnostic(
				dc,
				'schema retrieval',
				errorMessage,
				DiagnosticSeverity.error,
				null
			)
		}
		return p.result(null)
	}

	const basename = path.basename(filePath)
	const dir = path.dirname(filePath)
	if (basename === schemaFileName) {
		//don't validate the schema against itself
		dc({
			source: "schema retrieval",
			severity: DiagnosticSeverity.warning,
			message: "valdating schema file against internal schema",
			range: null,
		})

		return validateDocumentAfterExternalSchemaResolution(
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
					'schema retrieval',
					'unknown file system error',
					DiagnosticSeverity.error,
					null
				)
				return p.result(null)
			}
		},
		schemaStream => {

			return deserializeSchemaFromStream(
				schemaStream,
				(message, _range) => {
					dc({
						source: "schema retrieval",
						message: `error in external schema: ${message}`,
						range: null,
						severity: DiagnosticSeverity.error,
					})
				},
			).mapError(validateThatErrorsAreFound).try(
				schemaAndSideEffects => {

					return validateDocumentAfterExternalSchemaResolution(
						documentText,
						schemaAndSideEffects.schema,
						makeHTTPRequest,
						dc,
						sideEffectHandlers.concat([schemaAndSideEffects.createSideEffects(
							(
								message,
								range,
								severity
							) => {
								addDiagnostic(
									dc,
									"validation",
									message,
									severity,
									range
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