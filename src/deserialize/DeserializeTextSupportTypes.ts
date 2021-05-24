import * as astn from "astn"
import * as p from "pareto"

import { DiagnosticSeverity } from "../API/DiagnosticSeverity"

import { SchemaSchemaError } from "./SchemaSchemaError"
import { DeserializationDiagnostic } from "./DeserializationDiagnostic"

export type RetrievalError =
	| ["not found", {
		//
	}]
	| ["other", {
		"description": string
	}]

export type LoadDocumentDiagnosticType =
	| ["schema retrieval", {
		issue:
		| ["unknown retrieval error", { "description": string }]
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
		data: DeserializationDiagnostic
		range: astn.Range
	}]

export type LoadDocumentDiagnostic = {
	type: LoadDocumentDiagnosticType
	severity: DiagnosticSeverity
}

export type DiagnosticCallback = (diagnostic: LoadDocumentDiagnostic) => void

export type ResolveExternalSchema = (id: string) => p.IUnsafeValue<p.IStream<string, null>, RetrievalError>