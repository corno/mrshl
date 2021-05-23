/* eslint
    "max-classes-per-file": off,
*/

import * as astn from "astn"
import { printInternalSchemaDeserializationError } from "./printInternalSchemaDeserializationError"
import { DeserializeDiagnostic } from "../deserialize/DeserializeDiagnostic"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function printDeserializeDiagnostic($: DeserializeDiagnostic): string {
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
            return astn.printExpectError($$)
        }
        case "parsing": {
            const $$ = $.type[1]
            return astn.printParsingError($$)
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