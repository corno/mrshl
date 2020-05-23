import * as bc from "bass-clarinet-typed"
import * as p from "pareto-20"
import * as mrshlschemaschema01 from "./schemas/mrshl/schemaschema@0.1"
import * as metadata01 from "./schemas/metadata@0.1"
import * as md from "./metaDataSchema"
import * as sideEffects from "./SideEffectsAPI"
import { DiagnosticSeverity } from "./loadDocument"

export type SchemaAndSideEffects = {
    schema: md.Schema
    sideEffects: sideEffects.Root
}

export type AttachSchemaDeserializer = (
    parser: bc.Parser,
    onSchemaError: (message: string, range: bc.Range) => void,
    onValidationError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void,
) => p.IUnsafePromise<SchemaAndSideEffects, null>

export const schemas: {
    [key: string]: AttachSchemaDeserializer
} = {
    "mrshl/schemaschema@0.1": mrshlschemaschema01.attachSchemaDeserializer,
    "metadata@0.1": metadata01.attachSchemaDeserializer,
}
