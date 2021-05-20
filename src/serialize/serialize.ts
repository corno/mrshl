import * as p from "pareto"
import * as astn from "astn"
import * as syncAPI from "../syncAPI"
import { serializeNode } from "./serializeInstanceData"
import { serializeMetaData } from "./serializeMetaData"

class InArray<T> implements astn.IInArray<T> {
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
): p.IStream<string, null> {
    const rootComments = dataset.rootComments.getComments()
    const allComments = dataset.documentComments.getComments().concat(rootComments)
    return astn.serializeDocument(
        {
            schema: serializeMetaData(internalSchemaSpecification, dataset.schema),
            root: serializeNode(dataset.root),
            documentComments: new InArray(allComments.map(c => {
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
