import * as bc from "bass-clarinet-typed"
import * as p from "pareto-20"
import { createDeserializer } from "./deserialize"
import { SchemaAndSideEffects, InternalSchemaDeserializationError } from "../../schemas"
import { createNOPSideEffects } from "../../deserialize"
import { createInternalSchemaHandler } from "../../createInternalSchemaHandler"

export function createSchemaAndSideEffects(
    onSchemaError: (error: InternalSchemaDeserializationError, range: bc.Range) => void,
): bc.ParserEventConsumer<SchemaAndSideEffects, null> {
    let foundError = false
    let metadata: null | SchemaAndSideEffects = null
    return createInternalSchemaHandler(
        (error, range) => {
            onSchemaError(["internal schema", error], range)
            foundError = true
        },
        createDeserializer(
            (error, range) => {
                onSchemaError(["expect", error], range)
            },
            (errorMessage, range) => {
                onSchemaError(["validation", { message: errorMessage }], range)
            },
            md2 => {
                metadata = md2 === null
                    ? null
                    : {
                        schema: md2,
                        createSideEffects: () => createNOPSideEffects(),
                    }
            }
        ),
        null,
        () => {
            if (metadata === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                return p.error<SchemaAndSideEffects, null>(null)
            } else {
                return p.success(metadata)
            }
        }
    )
}