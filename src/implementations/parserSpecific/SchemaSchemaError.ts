import * as astn from "astn"
import { InternalSchemaDeserializationError, InternalSchemaError } from "../../interfaces/schemaPlugin/internalSchemaDerializationError"

export type SchemaSchemaError =
    | ["internal schema", InternalSchemaError]
    | ["unknown schema schema", {
        name: string
    }]
    | ["missing schema schema definition"]
    | ["parsing", astn.ParsingError]
    | ["schema processing", InternalSchemaDeserializationError]

