import * as mrshlschemaschema01 from "../plugins/schemas/mrshl/schemaschema@0.1"
import * as metadata01 from "../plugins/schemas/mrshl/metadata@0.1"
import { SchemaSchemaBuilder } from "../parserSpecific"

export function getSchemaSchemaBuilder<Annotation>(
    name: string,
): SchemaSchemaBuilder<Annotation> | null {
    switch (name) {
        case "mrshl/schemaschema@0.1": return onSchemaError => mrshlschemaschema01.createSchemaAndSideEffects<Annotation>(onSchemaError)
        case "mrshl/metadata@0.1": return onSchemaError => metadata01.createSchemaAndSideEffects<Annotation>(onSchemaError)
        default: return null
    }

}