import * as bc from "bass-clarinet"
import { Schema } from "./types"
import { createDeserializer } from "./deserialize"
import * as b from "./builders"
import * as ds from "../../datasetAPI"

export function attachSchemaDeserializer(parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (dataset: ds.Dataset | null) => void) {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }
    let metadata: null | Schema = null


    parser.ondata.subscribe(bc.createStackedDataSubscriber(
        {


            valueHandler: {
                array: openData => {
                    onSchemaError("unexpected array as schema", openData.start)
                    return bc.createDummyArrayHandler()
                },
                object: createDeserializer(
                    (errorMessage, range) => {
                        onSchemaError(errorMessage, range)
                    },
                    md => {
                        metadata = md
                    }
                ),
                simpleValue: (_value, svData) => {
                    onSchemaError("unexpected simple value as schema", svData.range)
                },
                taggedUnion: tuData => {
                    onSchemaError("unexpected typed union as schema", tuData.startRange)
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
            onSchemaError(error.rangeLessMessage, error.range)
        },
        () => {
            if (metadata === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                callback(null)
            } else {
                callback(new b.Dataset(metadata))
            }
        }
    ))
}