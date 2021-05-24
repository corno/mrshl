import * as p from "pareto"

import * as sideEffects from "../API/ParsingSideEffectsAPI"
import * as t from "../API/types"

import { IDataset } from "../dataset"
import { IDeserializedDataset } from "./IDeserializedDataset"
import { DiagnosticCallback, RetrievalError, ResolveExternalSchema } from "./DeserializeTextSupportTypes"

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
	sideEffectHandlers: sideEffects.Root[],
	createInitialDataset: (
		schema: t.Schema,
	) => IDataset,
) => p.IUnsafeValue<IDeserializedDataset, null>