import { SchemaAndSideEffects } from "./SchemaAndSideEffects"
import * as astncore from "astn-core"
import { InternalSchemaDeserializationError } from "./internalSchemaDerializationError"

export type SchemaSchemaBuilder<Annotation> = (
    onSchemaError: (error: InternalSchemaDeserializationError, annotation: Annotation) => void
) => astncore.ITreeBuilder<Annotation, SchemaAndSideEffects<Annotation>, null>