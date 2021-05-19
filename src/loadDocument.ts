import * as path from "path"
import * as md from "./types"
import {
	createFromURLSchemaDeserializer,
	deserializeDataset,
	deserializeSchemaFromStream,
	IDeserializedDataset,
	DeserializeDiagnostic,
	ExternalSchemaDeserializationError,
	SchemaSchemaError,
	printDeserializeDiagnostic,
	printSchemaSchemaError,
	SchemaHost,
} from "./deserialize"
import * as sideEffects from "./ParsingSideEffectsAPI"
import * as astn from "astn"
import * as p from "pareto"
import { IDataset } from "./dataset"
import { MakeHTTPrequest } from "./makeHTTPrequest"

function assertUnreachable<RT>(_x: never): RT {
	throw new Error("unreachable")
}

export enum DiagnosticSeverity {
	warning,
	error
}

export type LoadDocumentDiagnosticType =
	| ["schema retrieval", {
		issue:
		| ["unknown file system error"]
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
		data: DeserializeDiagnostic
		range: astn.Range
	}]

export type LoadDocumentDiagnostic = {
	type: LoadDocumentDiagnosticType
	severity: DiagnosticSeverity
}

export function printLoadDocumentDiagnostic(loadDiagnostic: LoadDocumentDiagnostic): string {
	switch (loadDiagnostic.type[0]) {
		case "deserialization": {
			const $ = loadDiagnostic.type[1]
			return `${printDeserializeDiagnostic($.data)} @ ${astn.printRange($.range)}`
		}
		case "schema retrieval": {
			const $ = loadDiagnostic.type[1]
			switch ($.issue[0]) {
				case "error in external schema": {
					const $$ = $.issue[1]
					return `error in external schema: ${printSchemaSchemaError($$)}`
				}
				case "found both external and internal schema. ignoring internal schema": {
					return `found both external and internal schema. ignoring internal schema`
				}
				case "missing schema": {
					return `missing schema`
				}
				case "no valid schema": {
					return `no valid schema`
				}
				case "unknown file system error": {
					return `unknown file system error`
				}
				case "validating schema file against internal schema": {
					return `this is the directory's schema file. It is validated against its own internal schema`
				}
				default:
					return assertUnreachable($.issue[0])
			}
		}
		case "structure": {
			const $ = loadDiagnostic.type[1]
			return $.message
		}
		case "validation": {
			const $ = loadDiagnostic.type[1]
			return `${$.message} @ ${astn.printRange($.range)}`
		}
		default:
			return assertUnreachable(loadDiagnostic.type[0])
	}
}

type DiagnosticCallback = (diagnostic: LoadDocumentDiagnostic) => void

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

export enum FileError {
	FileNotFound,
	UnknownError,
}

export function loadDocument(
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