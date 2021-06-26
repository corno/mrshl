/* eslint
    "max-classes-per-file": off,
*/

import * as astncore from "astn-core"
import * as astn from "astn"
import { InternalSchemaDeserializationError } from "./SchemaDerializationErrors"

export type DeserializationDiagnosticType =
    | ["structure", {
        message: "ignoring invalid internal schema"
    }]
    | ["expect", astncore.ExpectError]
    | ["deserializer", {
        message: string
    }]
    | ["stacked", astncore.StackedDataErrorType]
    | ["tokenizer", astn.PreTokenizerError]
    | ["structure2", astn.TextErrorType]
    | ["tree", astn.TreeParserError]
    | ["schema error", InternalSchemaDeserializationError]

export type DeserializationDiagnostic = {
    type: DeserializationDiagnosticType
}
