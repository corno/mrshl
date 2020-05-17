import * as path from "path"
import { Dataset } from "./syncAPI"
import * as md from "./metaDataSchema"
import { NodeSideEffectsAPI, createFromURLSchemaDeserializer, deserializeDataset, deserializeSchemaFromString } from "./deserialize"
import * as b from "./builders"
import * as bc from "bass-clarinet-typed"
import * as p from "pareto-20"

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
	externalSchema: p.IUnsafePromise<md.Schema, null>,
	diagnosticCallback: DiagnosticCallback,
	sideEffects: NodeSideEffectsAPI[],
): p.IUnsafePromise<Dataset, string> {

	const schemaReferenceResolver = createFromURLSchemaDeserializer(
		'www.astn.io',
		'/dev/schemas/',
		7000,
		(instanceValidationErrorMessage, range) => {
			addDiagnostic(
				diagnosticCallback,
				"constraint validation",
				instanceValidationErrorMessage,
				DiagnosticSeverity.error,
				range
			)
		}
	)

	const allSideEffects = sideEffects.slice(0)

	return deserializeDataset(
		documentText,
		internalSchemaAndSideEffects => {
			return externalSchema
				.mapResult(schema => {
					if (internalSchemaAndSideEffects !== null) {
						addDiagnostic(
							diagnosticCallback,
							"schema retrieval",
							"found both external and internal schema. ignoring internal schema",
							DiagnosticSeverity.warning,
							null,
						)
					}
					return p.result(new b.Dataset(schema))
				}).tryToCatch(() => {
					if (internalSchemaAndSideEffects !== null) {
						allSideEffects.push(internalSchemaAndSideEffects.sideEffects)
						return p.success(new b.Dataset(internalSchemaAndSideEffects.schema))

					}
					addDiagnostic(
						diagnosticCallback,
						"structure",
						"missing (valid) schema",
						DiagnosticSeverity.error,
						null,
					)
					return p.error(null)
				})
		},
		schemaReferenceResolver,
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

export function loadDocument(
	documentText: string,
	filePath: string,
	readSchemaFile: (dir: string, schemaFileName: string) => p.IUnsafePromise<string | null, string>,
	diagnosticCallback: DiagnosticCallback,
	sideEffects: NodeSideEffectsAPI[],
): p.IUnsafePromise<Dataset, null> {

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
			p.error(null),
			dc,
			sideEffects,
		).mapError(validateThatErrorsAreFound)
	}
	return readSchemaFile(
		dir,
		schemaFileName,
	).mapError(errorMessage => {
		//something else went wrong
		addDiagnostic(
			dc,
			'schema retrieval',
			errorMessage,
			DiagnosticSeverity.error,
			null
		)
		return p.result(null)

	}).try(serializedSchema => {
		if (serializedSchema === null) {
			//there is no schema file
			return validateDocumentAfterExternalSchemaResolution(
				documentText,
				p.error(null),
				dc,
				sideEffects,
			).mapError(validateThatErrorsAreFound)
		} else {

			return deserializeSchemaFromString(
				serializedSchema,
				(message, _range) => {
					dc({
						source: "schema retrieval",
						message: `error in external schema: ${message}`,
						range: null,
						severity: DiagnosticSeverity.error,
					})
				},
				(instanceValidationErrorMessage, range, severity) => {
					dc({
						source: "constraint validation",
						message: instanceValidationErrorMessage,
						range: range,
						severity: severity,
					})

				}
			).mapError(validateThatErrorsAreFound).try(
				schemaAndSideEffects => {
					return validateDocumentAfterExternalSchemaResolution(
						documentText,
						p.success(schemaAndSideEffects.schema),
						dc,
						sideEffects.concat([schemaAndSideEffects.sideEffects]),
					).mapError(validateThatErrorsAreFound)
				}
			)
		}
	})
}