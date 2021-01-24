import * as bc from "bass-clarinet"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../schemas"

export type SchemaError = {
    problem:
        | "no valid schema"
        | "missing schema"
}

export function deserializeSchemaFromStream(
    schemaStream: p.IStream<string, null>,
    onError: (message: string, range: bc.Range) => void,
): p.IUnsafeValue<SchemaAndSideEffects, SchemaError> {
    //console.log("FROM STRING")

    return schemaStream.consume(
        null,
        createSchemaDeserializer(
            onError,
        ),
    ).mapError(
        () => {
            return p.result({ problem: "missing schema"})
        }
    )

    // schemaDeserializer.onData(serializedSchema)
    // return schemaDeserializer.onEnd(false, null).mapError(
    //     () => {
    //         return p.result("missing schema")
    //     }
    // )

}
