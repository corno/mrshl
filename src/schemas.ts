import * as bc from "bass-clarinet-typed"
import * as mrshlschemaschema01 from "./schemas/mrshl/schemaschema@0.1"
import * as metadata01 from "./schemas/metadata@0.1"
import * as md from "./metaDataSchema"
import * as sideEffects from "./SideEffectsAPI"
import { DiagnosticSeverity } from "./loadDocument"

export type SchemaAndSideEffects = {
    schema: md.Schema
    createSideEffects: (
        onValidationError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void,
    ) => sideEffects.Root
}

export type CreateSchemaAndSideEffectsBuilderFunction = (
    onSchemaError: (message: string, range: bc.Range) => void,
) => bc.ParserEventConsumer<SchemaAndSideEffects, null>

export const schemas: {
    [key: string]: CreateSchemaAndSideEffectsBuilderFunction
} = {
    "mrshl/schemaschema@0.1": mrshlschemaschema01.createSchemaAndSideEffects,
    "metadata@0.1": metadata01.createSchemaAndSideEffects,
}
