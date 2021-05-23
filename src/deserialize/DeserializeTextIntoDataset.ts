import * as p from "pareto"

import * as sideEffects from "../API/ParsingSideEffectsAPI"
import * as t from "../API/types"

import { MakeHTTPrequest } from "./MakeHTTPrequest"
import { SchemaHost } from "./SchemaHost"
import { IDataset } from "../dataset"
import { IDeserializedDataset } from "./IDeserializedDataset"
import { DiagnosticCallback, FileError } from "./DeserializeTextSupportTypes"

/**
 * definition for the function that deserializes an ASTN text into a dataset
 */
export type DeserializeTextIntoDataset = (
	schemaHost: SchemaHost,
	documentText: string,
	filePath: string,
	makeHTTPRequest: MakeHTTPrequest,
	readSchemaFile: (dir: string, schemaFileName: string) => p.IUnsafeValue<p.IStream<string, null>, FileError>,
	diagnosticCallback: DiagnosticCallback,
	sideEffectHandlers: sideEffects.Root[],
	createInitialDataset: (
		schema: t.Schema,
	) => IDataset,
) => p.IUnsafeValue<IDeserializedDataset, null>