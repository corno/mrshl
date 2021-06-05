import { SchemaAndSideEffects } from "../interfaces/schemaPlugin/SchemaAndSideEffects"
import * as astncore from "astn-core"

import * as mrshlschemaschema01 from "../plugins/schemas/mrshl/schemaschema@0.1"
import * as metadata01 from "../plugins/schemas/mrshl/metadata@0.1"
import { InternalSchemaDeserializationError } from "../interfaces/schemaPlugin/internalSchemaDerializationError"

export type SchemaSchemaBuilder<Annotation> = (
    onSchemaError: (error: InternalSchemaDeserializationError, annotation: Annotation) => void
) => astncore.ITreeBuilder<Annotation, SchemaAndSideEffects<Annotation>, null>

export function getSchemaSchemaBuilder<Annotation>(
    name: string,
): SchemaSchemaBuilder<Annotation> | null {
    switch (name) {
        case "mrshl/schemaschema@0.1": return onSchemaError => mrshlschemaschema01.createSchemaAndSideEffects<Annotation>(onSchemaError)
        case "metadata@0.1": return onSchemaError => metadata01.createSchemaAndSideEffects<Annotation>(onSchemaError)
        default: return null
    }

}