import * as path from "path"
import * as md from "./metaDataSchema"
import { createFromURLSchemaDeserializer, deserializeDataset, deserializeSchemaFromString } from "./deserialize"
import * as sideEffects from "./SideEffectsAPI"
import * as bc from "bass-clarinet-typed"
import * as p from "pareto-20"
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
	externalSchema: p.IUnsafePromise<md.Schema, null>,
	makeHTTPrequest: MakeHTTPrequest,
	diagnosticCallback: DiagnosticCallback,
	sideEffectNodes: sideEffects.Node[],
	createDataset: (schema: md.Schema) => IDataset,
): p.IUnsafePromise<IDataset, string> {

	const schemaReferenceResolver = createFromURLSchemaDeserializer(
		'www.astn.io',
		'/dev/schemas/',
		7000,
		makeHTTPrequest,
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

	const allSideEffects = sideEffectNodes.slice(0)

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
					return p.result(createDataset(schema))
				}).tryToCatch(() => {
					if (internalSchemaAndSideEffects !== null) {
						allSideEffects.push(internalSchemaAndSideEffects.sideEffects)
						return p.success(createDataset(internalSchemaAndSideEffects.schema))

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
	makeHTTPRequest: MakeHTTPrequest,
	readSchemaFile: (dir: string, schemaFileName: string) => p.IUnsafePromise<string | null, string>,
	diagnosticCallback: DiagnosticCallback,
	sideEffectNodes: sideEffects.Node[],
	createDataset: (schema: md.Schema) => IDataset,
): p.IUnsafePromise<IDataset, null> {

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
			makeHTTPRequest,
			dc,
			sideEffectNodes,
			createDataset,
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
				makeHTTPRequest,
				dc,
				sideEffectNodes,
				createDataset,
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
						makeHTTPRequest,
						dc,
						sideEffectNodes.concat([schemaAndSideEffects.sideEffects]),
						createDataset,
					).mapError(validateThatErrorsAreFound)
				}
			)
		}
	})
}