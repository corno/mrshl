import { DiagnosticSeverity } from "./DiagnosticSeverity"
import * as t from "./types"
import * as sideEffects from "./ParsingSideEffectsAPI"


/**
 * a schema implementation should provide this type
 */
 export type SchemaAndSideEffects<Annotation> = {
    schema: t.Schema
    createAdditionalValidator: (
        onValidationError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) => sideEffects.Root<Annotation>
}
