import * as astn from "astn"

import { DiagnosticSeverity } from "../API/DiagnosticSeverity"

import { SchemaSchemaError } from "./SchemaSchemaError"
import { DeserializeDiagnostic } from "./DeserializeDiagnostic"

export enum FileError {
	FileNotFound,
	UnknownError,
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

export type DiagnosticCallback = (diagnostic: LoadDocumentDiagnostic) => void
