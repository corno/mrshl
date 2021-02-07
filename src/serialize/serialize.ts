import * as p from "pareto"
import * as bc from "bass-clarinet-typed"
import * as syncAPI from "../syncAPI"
import { serializeNode } from "./serializeInstanceData"
import { serializeMetaData } from "./serializeMetaData"

class InArray<T> implements bc.IInArray<T> {
    private readonly elements: T[]
    constructor(elements: T[]) {
        this.elements = elements
    }
    isEmpty() {
        return this.elements.length === 0
    }
    map<R>(callback: (element: T) => R) {
        return new InArray(this.elements.map(e => callback(e)))
    }

    forEach(callback: (element: T) => void) {
        this.elements.forEach(e => callback(e))
    }
}

export function serialize(
    dataset: syncAPI.IDataset,
    internalSchemaSpecification: syncAPI.InternalSchemaSpecification,
    compact: boolean,
): p.IStream<string, null> {
    return bc.serializeDocument(
        {
            schema: serializeMetaData(internalSchemaSpecification, dataset.schema),
            root: serializeNode(dataset.root, compact),
            compact: compact,
            documentComments: new InArray(dataset.comments.getComments().map(c => {
                return {
                    text: c.value,
                }
            })),
        },
        `    `,
        true,
        `\r\n`
    )
}
