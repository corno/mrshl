import * as bc from "bass-clarinet"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as ds from "../datasetAPI"

export function deserializeSchemaFromString(serializedSchema: string, onError: (message: string, range: bc.Range) => void): Promise<ds.Dataset> {
    return new Promise((resolve, reject) => {
        const schemaTok = createSchemaDeserializer(onError, schema => {
            if (schema === null) {
                reject("missing schema")
            } else {
                resolve(schema)
            }
        })
        schemaTok.write(serializedSchema, {
            pause: () => {
                //
            },
            continue: () => {
                //
            },
        })
        schemaTok.end()
    })
}
