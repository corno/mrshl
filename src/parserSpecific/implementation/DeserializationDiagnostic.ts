/* eslint
    "max-classes-per-file": off,
*/

import * as astncore from "astn-core"
import * as astn from "astn"
import { InternalSchemaDeserializationError } from "../interface"

export type DeserializationDiagnosticType =
    | ["structure", {
        message: "ignoring invalid internal schema"
    }]
    | ["expect", astncore.ExpectError]
    | ["deserializer", {
        message: string
    }]
    | ["stacked", astncore.StackedDataErrorType]
    | ["parsing", astn.ParsingError]
    | ["schema error", InternalSchemaDeserializationError]

export type DeserializationDiagnostic = {
    type: DeserializationDiagnosticType
}
