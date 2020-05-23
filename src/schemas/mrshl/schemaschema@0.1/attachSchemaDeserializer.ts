import * as bc from "bass-clarinet"
import { createDeserializer } from "./deserialize"
import * as t from "./types"
import { convert } from "./convert"
import { SchemaAndSideEffects } from "../../../schemas"
import * as p from "pareto-20"
import { DiagnosticSeverity } from "../../../loadDocument"
import * as sideEffects from "./sideEffects"

export function attachSchemaDeserializer(
    parser: bc.Parser,
    onSchemaError: (message: string, range: bc.Range) => void,
    onValidationError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void
): p.IUnsafePromise<SchemaAndSideEffects, null> {
    return attachSchemaDeserializer2(parser, onSchemaError).try(schema => {
        if (schema !== null) {
            return p.success({
                schema: convert(schema),
                sideEffects: new sideEffects.Root(schema, onValidationError),
            })
        } else {
            return p.error(null)
        }
    })
}

export function attachSchemaDeserializer2(
    parser: bc.Parser,
    onSchemaError: (message: string, range: bc.Range) => void,
): p.IUnsafePromise<t.Schema, null> {
    return p.wrapUnsafeFunction((onPromiseFail, onSuccess) => {
        let foundError = false
        function onSchemaSchemaError(message: string, range: bc.Range) {
            onSchemaError(message, range)
            foundError = true
        }
        let metaData: null | t.Schema = null

        parser.ondata.subscribe(bc.createStackedDataSubscriber(
            {
                valueHandler: {
                    array: openData => {
                        onSchemaSchemaError("unexpected array as schema", openData.range)
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
                    simpleValue: (_value, svData) => {
                        onSchemaSchemaError("unexpected string as schema", svData.range)
                    },
                    taggedUnion: tuData => {
                        onSchemaSchemaError("unexpected typed union as schema", tuData.range)
                        return {
                            option: () => bc.createDummyRequiredValueHandler(),
                            missingOption: () => {
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
            () => {
                if (metaData === null) {
                    if (!foundError) {
                        throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                    }
                    onPromiseFail(null)
                } else {
                    onSuccess(metaData)
                }
            }
        ))
    })
}