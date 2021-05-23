import * as astn from "astn"

export type InternalSchemaError =
    | ["unexpected schema format", {
        found:
        | ["array"]
        | ["object"]
        | ["simple value"]
        | ["tagged union"]
    }]
    | ["stacked", astn.StackedDataError]

export type SchemaReferenceResolvingError =
| ["schema cannot be an empty string"]
| ["errors in schema"]
| ["loading", {
    message: string
}]

export type InternalSchemaDeserializationError =
| ["validation", {
    "message": string
}]
| ["expect", astn.ExpectError]
| ["schema reference resolving", SchemaReferenceResolvingError]
| ["internal schema", InternalSchemaError]