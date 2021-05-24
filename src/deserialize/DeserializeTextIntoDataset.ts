import * as p from "pareto"

import * as sideEffects from "../API/ParsingSideEffectsAPI"
import * as t from "../API/types"

import { IDataset } from "../dataset"
import { IDeserializedDataset } from "./IDeserializedDataset"
import { DiagnosticCallback, FileError } from "./DeserializeTextSupportTypes"
import { SchemaAndSideEffects } from "../API/CreateSchemaAndSideEffects"
import { ExternalSchemaResolvingError } from "../API/SchemaErrors"

/**
 * definition for the function that deserializes an ASTN text into a dataset
 */
export type DeserializeTextIntoDataset = (
	documentText: string,
	filePath: string,
	resolveExternalSchema: (id: string) => p.IUnsafeValue<SchemaAndSideEffects, ExternalSchemaResolvingError>,
	readSchemaFile: (dir: string, schemaFileName: string) => p.IUnsafeValue<p.IStream<string, null>, FileError>,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root[],
	createInitialDataset: (
		schema: t.Schema,
	) => IDataset,
) => p.IUnsafeValue<IDeserializedDataset, null>