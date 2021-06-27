/* eslint
    "max-classes-per-file": off,
*/

import * as astn from "astn"
import { printInternalSchemaDeserializationError } from "./printInternalSchemaDeserializationError"
import { DeserializationDiagnostic } from "../../interfaces/DeserializationDiagnostic"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printDeserializationDiagnostic($: DeserializationDiagnostic): string {
    switch ($.type[0]) {
        case "stacked": {
            const $$ = $.type[1]
            return $$[0]
        }
        case "deserializer": {
            const $$ = $.type[1]
            return $$.message
        }
        case "tokenizer": {
            const $$ = $.type[1]
            return astn.printPreTokenizerError($$)
        }
        case "structure": {
            const $$ = $.type[1]
            return astn.printStructureError($$)
        }
        case "tree": {
            const $$ = $.type[1]
            return astn.printTreeParserError($$)
        }
        case "schema error": {
            const $$ = $.type[1]
            return printInternalSchemaDeserializationError($$)
        }
        case "ignoring invalid embedded schema": {
            return $.type[0]
        }
        case "ignoring invalid schema reference": {
            return $.type[0]
        }
        default:
            return assertUnreachable($.type[0])
    }
}
