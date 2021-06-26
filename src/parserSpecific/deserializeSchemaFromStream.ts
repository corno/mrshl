import * as astn from "astn"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects } from "./SchemaAndSideEffects"
import { SchemaSchemaError } from "./SchemaSchemaError"
import { ExternalSchemaDeserializationError } from "../interfaces/ExternalSchemaDeserializationError"


export function deserializeSchemaFromStream(
    schemaStream: p.IStream<string, null>,
    onError: (error: SchemaSchemaError, range: astn.Range) => void,
): p.IUnsafeValue<SchemaAndSideEffects<astn.ParserAnnotationData>, ExternalSchemaDeserializationError> {
    //console.log("FROM STRING")

    return schemaStream.tryToConsume<SchemaAndSideEffects<astn.ParserAnnotationData>, null>(
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
