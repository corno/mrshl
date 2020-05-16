import * as path from "path"
import { Dataset } from "./datasetAPI"
import { SideEffectsAPI, createFromURLSchemaDeserializer, deserializeDataset, deserializeSchemaFromString } from "./deserialize"
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
	dataset: null | Dataset,
	diagnosticCallback: DiagnosticCallback,
	sideEffects: SideEffectsAPI | null,
): p.IUnsafePromise<Dataset, string> {

	const schemaReferenceResolver = createFromURLSchemaDeserializer('www.astn.io', '/dev/schemas/', 7000)

	return deserializeDataset(
		documentText,
		dataset,
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
	const basename = path.basename(filePath)
	const dir = path.dirname(filePath)

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
				null,
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
						dataset,
						dc,
						sideEffects,
					).mapError(validateThatErrorsAreFound)
				}
			)
		}
	})
}