import * as astn from "astn"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../interfaces/SchemaAndSideEffects"
import { SchemaSchemaError } from "../interfaces/SchemaSchemaError"
import { ExternalSchemaDeserializationError } from "../interfaces/ExternalSchemaDeserializationError"
import { SchemaSchemaBuilder } from "../interfaces"


export function deserializeSchemaFromStream(
    schemaStream: p.IStream<string, null>,
    onError: (error: SchemaSchemaError, range: astn.Range) => void,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<astn.TokenizerAnnotationData> | null,
): p.IUnsafeValue<SchemaAndSideEffects<astn.TokenizerAnnotationData>, ExternalSchemaDeserializationError> {
    //console.log("FROM STRING")

    return schemaStream.tryToConsume<SchemaAndSideEffects<astn.TokenizerAnnotationData>, null>(
        null,
        createSchemaDeserializer(
            onError,
            getSchemaSchemaBuilder,
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
