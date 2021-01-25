import * as bc from "bass-clarinet"
import { createDeserializer } from "./createDeserializer"
import * as t from "./types"
import { convert } from "./convert"
import { SchemaAndSideEffects, InternalSchemaDeserializationError } from "../../../schemas"
import * as p from "pareto-20"
import { DiagnosticSeverity } from "../../../loadDocument"
import * as sideEffects from "./sideEffects"
import { createInternalSchemaHandler } from "../../../createInternalSchemaHandler"

export function createSchemaAndSideEffects(
    onSchemaError: (error: InternalSchemaDeserializationError, range: bc.Range) => void,
): bc.ParserEventConsumer<SchemaAndSideEffects, null> {
    const isb = createInternalSchemaBuilder(onSchemaError)
    return {
        onData: (data: bc.BodyEvent): p.IValue<boolean> => {
            return isb.onData(data)
        },
        onEnd: (aborted: boolean, location: bc.Location): p.IUnsafeValue<SchemaAndSideEffects, null> => {
            return isb.onEnd(aborted, location).mapResult(schema => {
                return p.result({
                    schema: convert(schema),
                    createSideEffects: (
                        onValidationError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void,
                    ) => new sideEffects.Root(schema, onValidationError),
                })
            })
        },
    }
}

export function createInternalSchemaBuilder(
    onSchemaError: (error: InternalSchemaDeserializationError, range: bc.Range) => void,
): bc.ParserEventConsumer<t.Schema, null> {
    let foundError = false
    let metaData: null | t.Schema = null

    function onSchemaSchemaError(error: InternalSchemaDeserializationError, range: bc.Range) {
        onSchemaError(error, range)
        foundError = true
    }

    return createInternalSchemaHandler(
        (error, range) => {
            onSchemaError(["internal schema", error], range)
            foundError = true
        },
        createDeserializer(
            (errorMessage, range) => {
                onSchemaSchemaError(["expect", errorMessage], range)
            },
            (message, range) => {
                onSchemaSchemaError(["validation", { message: message}], range)
            },
            md2 => {
                metaData = md2
            }
        ),
        null,
        (): p.IUnsafeValue<t.Schema, null> => {
            if (metaData === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                return p.error(null)
            } else {
                return p.success(metaData)
            }
        }
    )
}