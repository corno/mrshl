import * as astn from "astn"
import { DiagnosticSeverity } from "./DiagnosticSeverity"
import * as t from "./types"
import * as sideEffects from "./ParsingSideEffectsAPI"
import { InternalSchemaDeserializationError } from "./SchemaErrors"


/**
 * a schema implementation should provide this type
 */
 export type SchemaAndSideEffects = {
    schema: t.Schema
    createAdditionalValidator: (
        onValidationError: (message: string, range: astn.Range, severity: DiagnosticSeverity) => void,
    ) => sideEffects.Root
}

/**
 * a schema implementation must implement this function
 */
export type CreateSchemaAndSideEffects = (
    onSchemaError: (error: InternalSchemaDeserializationError, range: astn.Range) => void,
) => astn.TextParserEventConsumer<SchemaAndSideEffects, null>
