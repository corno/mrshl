import * as path from "path"
import { Dataset } from "./datasetAPI"
import * as md from "./metaDataSchema"
import { SideEffectsAPI, createFromURLSchemaDeserializer, deserializeDataset, deserializeSchemaFromString } from "./deserialize"
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
	sideEffects: SideEffectsAPI | null,
): p.IUnsafePromise<Dataset, string> {

	const schemaReferenceResolver = createFromURLSchemaDeserializer('www.astn.io', '/dev/schemas/', 7000)

	return deserializeDataset(
		documentText,
		internalSchema => {
			return externalSchema
				.mapResult(schema => {
					if (internalSchema !== null) {
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
					if (internalSchema !== null) {
						return p.success(new b.Dataset(internalSchema))

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
		sideEffects,
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
	sideEffects: SideEffectsAPI | null,
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
				}
			).mapError(validateThatErrorsAreFound).try(
				dataset => {
					return validateDocumentAfterExternalSchemaResolution(
						documentText,
						p.success(dataset),
						dc,
						sideEffects,
					).mapError(validateThatErrorsAreFound)
				}
			)
		}
	})
}