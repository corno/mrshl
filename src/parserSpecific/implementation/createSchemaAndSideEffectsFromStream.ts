import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import * as astn from "astn"
import { SchemaAndSideEffects } from "../interfaces/SchemaAndSideEffects"
import { RetrievalError } from "../interfaces/ResolveExternalSchema"
import { ReferencedSchemaResolvingError, SchemaSchemaBuilder } from "../interfaces"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function createSchemaAndSideEffectsFromStream(
    schemaStream: p.IUnsafeValue<p.IStream<string, null>, RetrievalError>,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<astn.TokenizerAnnotationData> | null,
): p.IUnsafeValue<SchemaAndSideEffects<astn.TokenizerAnnotationData>, ReferencedSchemaResolvingError> {
    return schemaStream.mapError<ReferencedSchemaResolvingError>(error => {
        switch (error[0]) {
            case "not found": {
                return p.value(["loading", { message: `schema not found` }])
            }
            case "other": {
                const $ = error[1]

                return p.value(["loading", { message: `other: ${$.description}` }])
            }
            default:
                return assertUnreachable(error[0])
        }
    }).try(
        stream => {
            //console.log("FROM URL")
            const schemaTok = createSchemaDeserializer(
                message => {
                    //do nothing with errors
                    console.error("SCHEMA ERROR", message)
                },
                getSchemaSchemaBuilder,
            )

            return stream.tryToConsume<SchemaAndSideEffects<astn.TokenizerAnnotationData>, null>(
                null,
                schemaTok,
            ).mapError(
                () => {
                    //const myUrl = new URL(encodeURI(reference), pathStart)
                    return p.value(["errors in schema"])
                },
            )
        },
    )
}
