import * as path from "path"
import * as md from "./types"
import {
	createFromURLSchemaDeserializer,
	deserializeDataset,
	deserializeSchemaFromStream,
	IDeserializedDataset,
	DeserializeDiagnostic,
	SchemaError,
} from "./deserialize"
import * as sideEffects from "./SideEffectsAPI"
import * as bc from "bass-clarinet-typed"
import * as p from "pareto"
import { IDataset } from "./dataset"
import { MakeHTTPrequest } from "./makeHTTPrequest"

export enum DiagnosticSeverity {
	warning,
	error
}

type LoadDocumentDiagnosticType =
	| ["schema retrieval", {
		issue:
		| ["unknown file system error"]
		| ["valdating schema file against internal schema"]
		| ["found both external and internal schema. ignoring internal schema"]
		| ["error in external schema", {
			message: string
		}]
		| ["no valid schema"]
		| ["missing schema"]
	}]
	| ["validation", {
		range: bc.Range
		message: string
	}]
	| ["structure", {
		message: "missing (valid) schema"
	}]
	| ["deserialization", DeserializeDiagnostic]

type LoadDocumentDiagnostic = {
	type: LoadDocumentDiagnosticType
	severity: DiagnosticSeverity
}

type DiagnosticCallback = (diagnostic: LoadDocumentDiagnostic) => void

function validateDocumentAfterExternalSchemaResolution(
	documentText: string,
	externalSchema: md.Schema | null,
	makeHTTPrequest: MakeHTTPrequest,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root[],
	createDataset: (
		schema: md.Schema,
	) => IDataset,
): p.IUnsafeValue<IDeserializedDataset, SchemaError> {
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
						["validation", { range: range, message: message }],
						severity,
					)
				}))
				return createDeserializedDataset(schemaAndSideEffects.schema, compact)
			}

			addDiagnostic(
				diagnosticCallback,
				["schema retrieval", {
					issue: ["found both external and internal schema. ignoring internal schema"],
				}],
				DiagnosticSeverity.warning,
			)
			return createDeserializedDataset(externalSchema, compact)
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
		errorDiagnostic => {
			addDiagnostic(
				diagnosticCallback,
				["deserialization", errorDiagnostic],
				DiagnosticSeverity.error,
			)
		},
		warningDiagnostic => {
			addDiagnostic(
				diagnosticCallback,
				["deserialization", warningDiagnostic],
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
		diagnostic: LoadDocumentDiagnostic
	) => {
		diagnosticFound = true
		return diagnosticCallback(diagnostic)
	}

	function validateThatErrorsAreFound(error: SchemaError) {
		if (!diagnosticFound) {
			addDiagnostic(
				dc,
				['schema retrieval', {
					issue: [error.problem],
				}],
				DiagnosticSeverity.error,
			)
		}
		return p.result(null)
	}

	const basename = path.basename(filePath)
	const dir = path.dirname(filePath)
	if (basename === schemaFileName) {
		//don't validate the schema against itself
		dc({
			type: ["schema retrieval", {
				issue: ["valdating schema file against internal schema"],
			}],
			severity: DiagnosticSeverity.warning,
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
					['schema retrieval', {
						issue: ['unknown file system error'],
					}],
					DiagnosticSeverity.error,
				)
				return p.result(null)
			}
		},
		schemaStream => {

			return deserializeSchemaFromStream(
				schemaStream,
				(message, _range) => {
					dc({
						type: ["schema retrieval", {
							issue: [`error in external schema`, {
								message: message,
							}],
						}],
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