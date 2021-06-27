import * as astn from "astn"
import { InternalSchemaDeserializationError } from "."
import { EmbeddedSchemaError } from "./SchemaDerializationErrors"

export type SchemaSchemaError =
    | ["internal schema", EmbeddedSchemaError]
    | ["unknown schema schema", {
        name: string
    }]
    | ["missing schema schema definition"]
    | ["tokenizer", astn.TokenError]
    | ["structure", astn.StructureErrorType]
    | ["tree", astn.TreeParserError]
    | ["schema processing", InternalSchemaDeserializationError]

