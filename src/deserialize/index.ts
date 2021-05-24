export * from "../errorPrinters/printDeserializeDiagnostic"
export * from "./SchemaHost"
export * from "./SchemaSchemaError"
export * from "./DeserializeTextIntoDataset"
export * from "./DeserializeTextSupportTypes"


import * as ld from "./implementation/deserializeTextIntoDataset"
import { DeserializeTextIntoDataset } from "./DeserializeTextIntoDataset"


export const deserializeTextIntoDataset: DeserializeTextIntoDataset = ld.deserializeTextIntoDataset