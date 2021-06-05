import { IDataset } from "../interfaces/dataset";
import { InternalSchemaSpecification } from "../interfaces/IDataset";


/**
 * this type has information about how the dataset was serialized in regards to compactness and schema specification
 */
 export type IDeserializedDataset = {
    internalSchemaSpecification: InternalSchemaSpecification
    dataset: IDataset
}