import * as bc from "bass-clarinet-typed"
import * as mrshlschemaschema01 from "./schemas/mrshl/schemaschema@0.1"
import * as metadata01 from "./schemas/metadata@0.1"
import * as ds from "./datasetAPI"

export type AttachSchemaDeserializer = (parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: ds.Dataset | null) => void) => void

export const schemas: {
    [key: string]: AttachSchemaDeserializer
} = {
    "mrshl/schemaschema@0.1": mrshlschemaschema01.attachSchemaDeserializer,
    "metadata@0.1": metadata01.attachSchemaDeserializer,
}
