/* eslint
    "max-classes-per-file": off,
*/

import * as astn from "astn"
import { InternalSchemaDeserializationError } from "../API/SchemaErrors"

export type DeserializeDiagnosticType =
    | ["structure", {
        message: "ignoring invalid internal schema"
    }]
    | ["expect", astn.ExpectError]
    | ["deserializer", {
        message: string
    }]
    | ["stacked", astn.StackedDataError]
    | ["parsing", astn.ParsingError]
    | ["schema error", InternalSchemaDeserializationError]

export type DeserializeDiagnostic = {
    type: DeserializeDiagnosticType
}
