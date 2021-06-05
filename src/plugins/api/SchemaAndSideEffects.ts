import { DiagnosticSeverity } from "../../etc/interfaces/DiagnosticSeverity"
import * as streamVal from "../../interfaces/streamingValidationAPI"
//import * as buildAPI from "../../buildAPI"


/**
 * a schema implementation should provide this type
 */
 export type SchemaAndSideEffects<Annotation> = {
    schema: streamVal.Schema
    createStreamingValidator: (
        onValidationError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) => streamVal.RootHandler<Annotation>
    //createAsyncValidator: () => buildAPI.Root
}
