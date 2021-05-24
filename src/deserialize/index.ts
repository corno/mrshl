export * from "../errorPrinters/printDeserializeDiagnostic"
export * from "./SchemaHost"
export * from "./SchemaSchemaError"
export * from "./DeserializeASTNTextIntoDataset"
export * from "./DeserializeTextSupportTypes"


import * as ld from "./implementation/deserializeTextIntoDataset"
import { DeserializeASTNTextIntoDataset } from "./DeserializeASTNTextIntoDataset"


export const deserializeTextIntoDataset: DeserializeASTNTextIntoDataset = ld.deserializeTextIntoDataset