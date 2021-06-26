import * as p from "pareto"

import * as astncore from "astn-core"
import * as astn from "astn"

import { IDeserializedDataset } from "./Dataset"
import { RetrievalError, ResolveExternalSchema } from "./ResolveExternalSchema"
import { DiagnosticCallback } from "./deserializeTextIntoDataset"

export type ContextSchemaData = {
	filePath: string
	getContextSchema: (dir: string, schemaFileName: string) => p.IUnsafeValue<p.IStream<string, null>, RetrievalError>
}

/**
 * definition for the function that deserializes an ASTN text into a dataset
 */
export type DeserializeASTNTextIntoDataset = (
	contextSchemaData: ContextSchemaData,
	astnText: string,
	resolveExternalSchema: ResolveExternalSchema,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: astncore.RootHandler<astn.ParserAnnotationData>[],
	createInitialDataset: (
		schema: astncore.Schema,
	) => astncore.IDataset,
) => p.IUnsafeValue<IDeserializedDataset, null>