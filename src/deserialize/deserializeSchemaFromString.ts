import * as bc from "bass-clarinet"
import { SchemaAndNodeBuilderPair } from "./deserializeDocument"
import { createSchemaDeserializer } from "./createSchemaDeserializer"

export function deserializeSchemaFromString(serializedSchema: string, onError: (message: string, range: bc.Range) => void): Promise<SchemaAndNodeBuilderPair> {
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
