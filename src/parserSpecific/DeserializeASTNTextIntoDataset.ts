import * as p from "pareto"

import * as streamVal from "astn-core"
import * as def from "astn-core"
import * as astn from "astn"

import { IDataset } from "astn-core"
import { IDeserializedDataset } from "astn-core"
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
	sideEffectHandlers: streamVal.RootHandler<astn.ParserAnnotationData>[],
	createInitialDataset: (
		schema: def.Schema,
	) => IDataset,
) => p.IUnsafeValue<IDeserializedDataset, null>