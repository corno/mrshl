import * as bc from "bass-clarinet"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../schemas"

export function deserializeSchemaFromStream(
    schemaStream: p.IStream<string, null>,
    onError: (message: string, range: bc.Range) => void,
): p.IUnsafeValue<SchemaAndSideEffects, string> {
    //console.log("FROM STRING")
    const schemaDeserializer = createSchemaDeserializer(
        onError,
    )

    return schemaStream.toUnsafeValue(
        null,
        schemaDeserializer,
    ).mapError(
        () => {
            return p.result("missing schema")
        }
    )

    // schemaDeserializer.onData(serializedSchema)
    // return schemaDeserializer.onEnd(false, null).mapError(
    //     () => {
    //         return p.result("missing schema")
    //     }
    // )

}
