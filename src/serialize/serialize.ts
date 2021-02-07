import * as p from "pareto"
import * as bc from "bass-clarinet-typed"
import * as syncAPI from "../syncAPI"
import { createSerializableDocument } from "./createSerializableDocument"

export function serialize(
    dataset: syncAPI.IDataset,
    internalSchemaSpecification: syncAPI.InternalSchemaSpecification,
    compact: boolean,
): p.IStream<string, null> {
    const sd = createSerializableDocument(dataset, internalSchemaSpecification, compact)
    return bc.serializeDocument(sd, `    `, true, `\r\n`)
}
