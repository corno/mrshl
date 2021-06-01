import * as p from "pareto"

import * as db5api from "../db5api"
import * as astn from "astn"

import { IDataset } from "../etc/dataset"
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
	sideEffectHandlers: db5api.RootHandler<astn.ParserAnnotationData>[],
	createInitialDataset: (
		schema: db5api.Schema,
	) => IDataset,
) => p.IUnsafeValue<IDeserializedDataset, null>