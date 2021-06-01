import * as astncore from "astn-core"

export type InternalSchemaError =
    | ["unexpected schema format", {
        found:
        | ["array"]
        | ["object"]
        | ["simple value"]
        | ["tagged union"]
    }]
    | ["stacked", astncore.StackedDataError]

export type ExternalSchemaResolvingError =
    | ["schema id cannot be an empty string"]
    | ["errors in schema"]
    | ["loading", {
        message: string
    }]

export type InternalSchemaDeserializationError =
    | ["validation", {
        "message": string
    }]
    | ["expect", astncore.ExpectError]
    | ["schema reference resolving", ExternalSchemaResolvingError]
    | ["internal schema", InternalSchemaError]