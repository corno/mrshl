import * as bc from "bass-clarinet"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as md from "../metaDataSchema"
import * as p from "pareto-20"

export function deserializeSchemaFromString(serializedSchema: string, onError: (message: string, range: bc.Range) => void): p.IUnsafePromise<md.Schema, string> {
    return createSchemaDeserializer(
        onError,
        schemaTok => {
            schemaTok.write(serializedSchema, {
                pause: () => {
                    //
                },
                continue: () => {
                    //
                },
            })
            schemaTok.end()
        },
    ).mapError(
        () => {
            return p.result("missing schema")
        }
    )
}
