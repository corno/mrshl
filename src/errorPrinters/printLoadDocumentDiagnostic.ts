import * as astn from "astn"
import { printSchemaSchemaError } from "./printSchemaSchemaError"
import { printDeserializeDiagnostic } from "./printDeserializeDiagnostic"
import { LoadDocumentDiagnostic } from "../deserialize/DeserializeTextSupportTypes"

function assertUnreachable<RT>(_x: never): RT {
	throw new Error("unreachable")
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