import * as astn from "astn"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../../API/CreateSchemaAndSideEffects"
import { SchemaSchemaError } from "../SchemaSchemaError"

export type ExternalSchemaDeserializationError = {
    problem:
        | "no valid schema"
        | "missing schema"
}

export function deserializeSchemaFromStream(
    schemaStream: p.IStream<string, null>,
    onError: (error: SchemaSchemaError, range: astn.Range) => void,
): p.IUnsafeValue<SchemaAndSideEffects, ExternalSchemaDeserializationError> {
    //console.log("FROM STRING")

    return schemaStream.tryToConsume<SchemaAndSideEffects, null>(
        null,
        createSchemaDeserializer(
            onError,
        ),
    ).mapError(
        () => {
            return p.value({ problem: "missing schema"})
        }
    )

    // schemaDeserializer.onData(serializedSchema)
    // return schemaDeserializer.onEnd(false, null).mapError(
    //     () => {
    //         return p.value("missing schema")
    //     }
    // )

}
