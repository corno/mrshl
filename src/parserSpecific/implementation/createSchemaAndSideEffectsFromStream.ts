import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import * as astn from "astn"
import { SchemaAndSideEffects } from "../interface/SchemaAndSideEffects"
import { RetrievalError } from "../interface/ResolveExternalSchema"
import { ExternalSchemaResolvingError, SchemaSchemaBuilder } from "../interface"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function createSchemaAndSideEffectsFromStream(
    schemaStream: p.IUnsafeValue<p.IStream<string, null>, RetrievalError>,
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<astn.ParserAnnotationData> | null,
): p.IUnsafeValue<SchemaAndSideEffects<astn.ParserAnnotationData>, ExternalSchemaResolvingError> {
    return schemaStream.mapError<ExternalSchemaResolvingError>(error => {
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

            return stream.tryToConsume<SchemaAndSideEffects<astn.ParserAnnotationData>, null>(
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
