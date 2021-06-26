/* eslint
    "max-classes-per-file": off,
*/

import * as astncore from "astn-core"
import * as astn from "astn"
import { printInternalSchemaDeserializationError } from "./printInternalSchemaDeserializationError"
import { DeserializationDiagnostic } from "../interfaces/DeserializationDiagnostic"

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
        case "expect": {
            const $$ = $.type[1]
            return astncore.printExpectError($$)
        }
        case "tokenizer": {
            const $$ = $.type[1]
            return astn.printPreTokenizerError($$)
        }
        case "structure2": {
            const $$ = $.type[1]
            return astn.printTextParserError($$)
        }
        case "tree": {
            const $$ = $.type[1]
            return astn.printTreeParserError($$)
        }
        case "schema error": {
            const $$ = $.type[1]
            return printInternalSchemaDeserializationError($$)
        }
        case "structure": {
            const $$ = $.type[1]
            return $$.message
        }
        default:
            return assertUnreachable($.type[0])
    }
}
