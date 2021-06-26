import * as astn from "astn"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../interface/SchemaAndSideEffects"
import { SchemaSchemaError } from "../interface/SchemaSchemaError"
import { ExternalSchemaDeserializationError } from "../interface/ExternalSchemaDeserializationError"
import { SchemaSchemaBuilder } from "../interface"


export function deserializeSchemaFromStream(
    schemaStream: p.IStream<string, null>,
    onError: (error: SchemaSchemaError, range: astn.Range) => void,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<astn.ParserAnnotationData> | null,
): p.IUnsafeValue<SchemaAndSideEffects<astn.ParserAnnotationData>, ExternalSchemaDeserializationError> {
    //console.log("FROM STRING")

    return schemaStream.tryToConsume<SchemaAndSideEffects<astn.ParserAnnotationData>, null>(
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
