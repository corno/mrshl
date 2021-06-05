import * as p from "pareto"

import * as streamVal from "../interfaces/streamingValidationAPI"
import * as astn from "astn"

import { IDataset } from "../etc/interfaces/dataset"
import { IDeserializedDataset } from "../etc/deserialize/IDeserializedDataset"
import { RetrievalError, ResolveExternalSchema } from "../etc/deserialize/DeserializeTextSupportTypes"
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
		schema: streamVal.Schema,
	) => IDataset,
) => p.IUnsafeValue<IDeserializedDataset, null>