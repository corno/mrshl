import * as bc from "bass-clarinet"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto-20"
import { SchemaAndSideEffects } from "../schemas"
import { DiagnosticSeverity } from "../loadDocument"

export function deserializeSchemaFromString(
    serializedSchema: string,
    onError: (message: string, range: bc.Range) => void,
    onInstanceValidationError: (message: string, range: bc.Range, severity: DiagnosticSeverity) => void
): p.IUnsafePromise<SchemaAndSideEffects, string> {
    return createSchemaDeserializer(
        onError,
        onInstanceValidationError,
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
