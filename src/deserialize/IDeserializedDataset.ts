import { InternalSchemaSpecification } from "../API/IDataset";
import { IDataset } from "../dataset";


/**
 * this type has information about how the dataset was serialized in regards to compactness and schema specification
 */
 export type IDeserializedDataset = {
    internalSchemaSpecification: InternalSchemaSpecification
    dataset: IDataset
}