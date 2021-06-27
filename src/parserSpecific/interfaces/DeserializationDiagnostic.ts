/* eslint
    "max-classes-per-file": off,
*/

import * as astncore from "astn-core"
import * as astn from "astn"
import { InternalSchemaDeserializationError } from "./SchemaDerializationErrors"

export type DeserializationDiagnosticType =
    | ["ignoring invalid embedded schema"]
    | ["ignoring invalid schema reference"]
    | ["deserializer", {
        message: string
    }]
    | ["stacked", astncore.StackedDataErrorType]
    | ["tokenizer", astn.TokenError]
    | ["structure", astn.StructureErrorType]
    | ["tree", astn.TreeParserError]
    | ["schema error", InternalSchemaDeserializationError]

export type DeserializationDiagnostic = {
    type: DeserializationDiagnosticType
}
