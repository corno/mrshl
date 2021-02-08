import * as bc from "bass-clarinet-typed"
import * as mrshlschemaschema01 from "./schemas/mrshl/schemaschema@0.1"
import * as metadata01 from "./schemas/mrshl/metadata@0.1"
import * as md from "./types"
import * as sideEffects from "./SideEffectsAPI"
import { DiagnosticSeverity } from "./loadDocument"
import { InternalSchemaError, printInternalSchemaError } from "./createInternalSchemaHandler"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

/**
 * a Document needs a schema to be validated. Besides the basic schema structure we want to be able to report additional
 * validation errors.
 * All built-in schemas create a combination of these 2
 */

export type SchemaReferenceResolvingError =
    | ["schema cannot be an empty string"]
    | ["errors in schema"]
    | ["loading", {
        message: string
    }]

export type InternalSchemaDeserializationError =
    | ["validation", {
        "message": string
    }]
    | ["expect", bc.ExpectError]
    | ["schema reference resolving", SchemaReferenceResolvingError]
    | ["internal schema", InternalSchemaError]

export function printInternalSchemaDeserializationError(error: InternalSchemaDeserializationError): string {
    switch (error[0]) {
        case "expect": {
            const $$$ = error[1]
            return bc.printExpectError($$$)
        }
        case "schema reference resolving": {
            const $$$ = error[1]
            switch ($$$[0]) {
                case "errors in schema": {
                    return `errors in schema`
                }
                case "loading": {
                    const $$$$ = $$$[1]
                    return $$$$.message
                }
                case "schema cannot be an empty string": {
                    return `schema cannot be an empty string`
                }
                default:
                    return assertUnreachable($$$[0])
            }
        }
        case "internal schema": {
            const $$$ = error[1]
            return printInternalSchemaError($$$)
        }
        case "validation": {
            const $$$ = error[1]

            return $$$.message
        }
        default:
            return assertUnreachable(error[0])
    }
}


export type SchemaAndSideEffects = {
    schema: md.Schema
    createSideEffects: (
        onValidationError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void,
    ) => sideEffects.Root
}

export type CreateSchemaAndSideEffectsBuilderFunction = (
    onSchemaError: (error: InternalSchemaDeserializationError, range: bc.Range) => void,
) => bc.ParserEventConsumer<SchemaAndSideEffects, null>

export const schemas: {
    [key: string]: CreateSchemaAndSideEffectsBuilderFunction
} = {
    "mrshl/schemaschema@0.1": mrshlschemaschema01.createSchemaAndSideEffects,
    "metadata@0.1": metadata01.createSchemaAndSideEffects,
}
