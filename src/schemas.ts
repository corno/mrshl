import * as mrshlschemaschema01 from "./schemas/mrshl/schemaschema@0.1"
import * as metadata01 from "./schemas/mrshl/metadata@0.1"
import { CreateSchemaAndSideEffects } from "./API/CreateSchemaAndSideEffects"

export const schemas: {
    [key: string]: CreateSchemaAndSideEffects
} = {
    "mrshl/schemaschema@0.1": mrshlschemaschema01.createSchemaAndSideEffects,
    "metadata@0.1": metadata01.createSchemaAndSideEffects,
}
