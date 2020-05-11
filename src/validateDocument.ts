import * as fs from "fs"
import * as path from "path"
import { Dataset } from "./datasetAPI"
import { SideEffectsAPI, createFromURLSchemaDeserializer, deserializeDataset, deserializeSchemaFromString } from "./deserialize"
import * as bc from "bass-clarinet-typed"

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
): Promise<Dataset> {

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

function diagnosticsFailed(
	source: string,
	message: string,
	diagnosticCallback: DiagnosticCallback,
): Promise<Dataset> {
	return new Promise<Dataset>((_resolve, reject) => {
		addDiagnostic(
			diagnosticCallback,
			source,
			message,
			DiagnosticSeverity.error,
			null
		)
		reject()

	})
}

export const schemaFileName = "schema.astn-schema"

export function validateDocument(
	documentText: string,
	filePath: string,
	diagnosticCallback: DiagnosticCallback,
	sideEffects: SideEffectsAPI | null,
): Promise<Dataset> {
	const basename = path.basename(filePath)
	const dir = path.dirname(filePath)

	let diagnosticFound = false
	const dc: DiagnosticCallback = (
		diagnostic: Diagnostic
	) => {
		diagnosticFound = true
		return diagnosticCallback(diagnostic)
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
		)
	}
	return fs.promises.readFile(
		path.join(dir, schemaFileName), { encoding: "utf-8" }
	).then(serializedSchema => {
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
		).then(schema => {

			return validateDocumentAfterExternalSchemaResolution(
				documentText,
				schema,
				dc,
				sideEffects,
			)
		}).catch(message => {
			if (!diagnosticFound) {
				return diagnosticsFailed(
					'schema retrieval',
					message,
					dc,
				)
			} else return new Promise<Dataset>((_resolve, reject) => {
				reject()
			})
		})
	}).catch(err => {
		if (err === undefined) {
			if (!diagnosticFound) {
				return diagnosticsFailed(
					'schema retrieval',
					"unknown error",
					dc,
				)
			}
		}
		if (err.code === "ENOENT") {
			//there is no schema file
			return validateDocumentAfterExternalSchemaResolution(
				documentText,
				null,
				dc,
				sideEffects,
			)
		} else {
			//something else went wrong
			return diagnosticsFailed(
				'schema retrieval',
				err.message,
				dc,
			)
		}
	})
}