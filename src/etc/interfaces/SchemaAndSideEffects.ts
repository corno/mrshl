import { DiagnosticSeverity } from "./DiagnosticSeverity"
import * as db5api from "../../db5api"


/**
 * a schema implementation should provide this type
 */
 export type SchemaAndSideEffects<Annotation> = {
    schema: db5api.Schema
    createAdditionalValidator: (
        onValidationError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) => db5api.RootHandler<Annotation>
}
