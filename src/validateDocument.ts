import * as fs from "fs"
import * as path from "path"
import { Dataset } from "./datasetAPI"
import { SideEffectsAPI, createFromURLSchemaDeserializer, deserializeDataset, deserializeSchemaFromString } from "./deserialize"
import * as bc from "bass-clarinet-typed"

export enum Severity {
	warning,
	error
}

type Diagnostic = {
	severity: Severity
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
		(errorMessage, range) => {
			addDiagnostic(
				diagnosticCallback,
				errorMessage,
				Severity.error,
				range,
			)
		},
		(warningMessage, range) => {
			addDiagnostic(
				diagnosticCallback,
				warningMessage,
				Severity.warning,
				range
			)
		},
		sideEffects,
	)
}

function addDiagnostic(
	callback: DiagnosticCallback,
	message: string,
	severity: Severity,
	range: bc.Range,
) {
	callback({
		severity: severity,
		message: message,
		range: range,
	})
}

function diagnosticsFailed(
	message: string,
	documentText: string,
	diagnosticCallback: DiagnosticCallback,
): Promise<Dataset> {
	return new Promise<Dataset>((_resolve, reject) => {
		addDiagnostic(
			diagnosticCallback,
			message,
			Severity.error,
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
				`error in schema: ${message}`,
				documentText,
				diagnosticCallback,
			)
		})
	}).catch(err => {
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
				`error while retrieving schema: ${err.message}`,
				documentText,
				diagnosticCallback,
			)
		}
	})
}