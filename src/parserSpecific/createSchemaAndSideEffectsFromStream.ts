import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import * as astn from "astn"
import { SchemaAndSideEffects } from "astn-core"
import { RetrievalError } from "./ResolveExternalSchema"
import { ExternalSchemaResolvingError } from "../interfaces/internalSchemaDerializationError"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function createSchemaAndSideEffectsFromStream(
    schemaStream: p.IUnsafeValue<p.IStream<string, null>, RetrievalError>
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
