import { DiagnosticSeverity } from "../DiagnosticSeverity"
import * as streamVal from "../streamingValidationAPI"
import * as def from "../typedParserDefinitions"



/**
 * a schema implementation should provide this type
 */
 export type SchemaAndSideEffects<Annotation> = {
    schema: def.Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) => streamVal.RootHandler<Annotation>
    //createAsyncValidator: () => buildAPI.Root
}
