import * as astncore from "astn-core"


export type InternalSchemaError =
    | ["unexpected schema format", {
        found:
        | ["multiline string"]
        | ["array"]
        | ["object"]
        | ["simple value"]
        | ["tagged union"]
    }]
    | ["stacked", astncore.StackedDataErrorType]