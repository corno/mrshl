export * from "./DeserializeASTNTextIntoDataset"
export * from "./deserializeSchemaFromStream"
export * from "./createCodeCompletionFinder"
export * from "./createHoverTextFinder"
export * from "./printSchemaSchemaError"

import * as ld from "./deserializeTextIntoDataset"
import { DeserializeASTNTextIntoDataset } from "./DeserializeASTNTextIntoDataset"


export const deserializeTextIntoDataset: DeserializeASTNTextIntoDataset = ld.deserializeTextIntoDataset