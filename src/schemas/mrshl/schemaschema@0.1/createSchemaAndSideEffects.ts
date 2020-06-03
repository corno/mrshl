import * as bc from "bass-clarinet"
import { createDeserializer } from "./createDeserializer"
import * as t from "./types"
import { convert } from "./convert"
import { SchemaAndSideEffects } from "../../../schemas"
import * as p from "pareto-20"
import { DiagnosticSeverity } from "../../../loadDocument"
import * as sideEffects from "./sideEffects"

export function createSchemaAndSideEffects(
    onSchemaError: (message: string, range: bc.Range) => void,
): bc.ParserEventConsumer<SchemaAndSideEffects, null> {
    const isb = createInternalSchemaBuilder(onSchemaError)
    return {
        onData: (data: bc.ParserEvent): p.IValue<boolean> => {
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
    onSchemaError: (message: string, range: bc.Range) => void,
): bc.ParserEventConsumer<t.Schema, null> {
    let foundError = false
    function onSchemaSchemaError(message: string, range: bc.Range) {
        onSchemaError(message, range)
        foundError = true
    }
    let metaData: null | t.Schema = null

    return bc.createStackedDataSubscriber(
        {
            valueHandler: {
                array: (range: bc.Range): bc.ArrayHandler => {
                    onSchemaSchemaError("unexpected array as schema", range)
                    return bc.createDummyArrayHandler()
                },
                object: createDeserializer(
                    (errorMessage, range) => {
                        onSchemaSchemaError(errorMessage, range)
                    },
                    md2 => {
                        metaData = md2
                    }
                ),
                simpleValue: (range: bc.Range): p.IValue<boolean> => {
                    onSchemaSchemaError("unexpected string as schema", range)
                    return p.result(false)
                },
                taggedUnion: (range: bc.Range): bc.TaggedUnionHandler => {
                    onSchemaSchemaError("unexpected typed union as schema", range)
                    return {
                        option: (): bc.RequiredValueHandler => bc.createDummyRequiredValueHandler(),
                        missingOption: (): void => {
                            //
                        },
                    }
                },
            },
            onMissing: () => {
                //
            },
        },
        error => {
            onSchemaSchemaError(error.rangeLessMessage, error.range)
        },
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