import * as bc from "bass-clarinet"
import * as p from "pareto-20"
import { createDeserializer } from "./deserialize"
import { SchemaAndSideEffects } from "../../schemas"
import { createNOPSideEffects } from "../../deserialize"
import { DiagnosticSeverity } from "../../loadDocument"

export function attachSchemaDeserializer(
    parser: bc.Parser,
    onSchemaError: (message: string, range: bc.Range) => void,
    _onValidationError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void
) {
    return p.wrapUnsafeFunction<SchemaAndSideEffects, null>((onPromiseFail, onSuccess) => {
        let foundError = false
        function onSchemaSchemaError(message: string, range: bc.Range) {
            onSchemaError(message, range)
            foundError = true
        }
        let metadata: null | SchemaAndSideEffects = null

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
                            metadata = md2 === null
                                ? null
                                : {
                                    schema: md2,
                                    sideEffects: createNOPSideEffects(),
                                }
                        }
                    ),
                    simpleValue: (_value, svData) => {
                        onSchemaSchemaError("unexpected simple value as schema", svData.range)
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
                if (metadata === null) {
                    if (!foundError) {
                        throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                    }
                    onPromiseFail(null)
                } else {
                    onSuccess(metadata)
                }
            }
        ))

    })
}