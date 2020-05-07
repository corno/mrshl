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
	range: bc.Range
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
	range: bc.Range,
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
	documentText: string,
	diagnosticCallback: DiagnosticCallback,
): Promise<Dataset> {
	return new Promise<Dataset>((_resolve, reject) => {
		addDiagnostic(
			diagnosticCallback,
			source,
			message,
			DiagnosticSeverity.error,
			{
				start: {
					position: 0,
					line: 0,
					column: 0,
				},
				end: {
					position: documentText.length,
					line: 0,
					column: 0,
				},
			}
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

	if (basename === schemaFileName) {
		//don't validate the schema against itself
		return validateDocumentAfterExternalSchemaResolution(
			documentText,
			null,
			diagnosticCallback,
			sideEffects,
		)
	}
	return fs.promises.readFile(
		path.join(dir, schemaFileName), { encoding: "utf-8" }
	).then(serializedSchema => {
		return deserializeSchemaFromString(
			serializedSchema,
			(_message, _range) => {
				throw new Error("HEEEEELP")
			}
		).then(schema => {
			return validateDocumentAfterExternalSchemaResolution(
				documentText,
				schema,
				diagnosticCallback,
				sideEffects,
			)
		}).catch(message => {
			return diagnosticsFailed(
				'schema error',
				message,
				documentText,
				diagnosticCallback,
			)
		})
	}).catch(err => {
		if (err === undefined) {
			return diagnosticsFailed(
				'schema retrieval',
				"unknown error",
				documentText,
				diagnosticCallback,
			)
		}
		if (err.code === "ENOENT") {
			//there is no schema file
			return validateDocumentAfterExternalSchemaResolution(
				documentText,
				null,
				diagnosticCallback,
				sideEffects,
			)
		} else {
			//something else went wrong
			return diagnosticsFailed(
				'schema retrieval',
				err.message,
				documentText,
				diagnosticCallback,
			)
		}
	})
}