import { IDataset } from "./dataset";
import { InternalSchemaSpecification } from "./InternalSchemaSpecification";


/**
 * this type has information about how the dataset was serialized in regards to compactness and schema specification
 */
 export type IDeserializedDataset = {
    internalSchemaSpecification: InternalSchemaSpecification
    dataset: IDataset
}