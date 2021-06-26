import * as astn from "astn"
import { InternalSchemaDeserializationError } from "../interfaces/internalSchemaDerializationError"
import { InternalSchemaError } from "astn-core"

export type SchemaSchemaError =
    | ["internal schema", InternalSchemaError]
    | ["unknown schema schema", {
        name: string
    }]
    | ["missing schema schema definition"]
    | ["parsing", astn.ParsingError]
    | ["schema processing", InternalSchemaDeserializationError]

