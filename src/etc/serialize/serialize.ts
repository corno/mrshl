// import * as p from "pareto"
// import * as astncore from "astn-core"
// import * as id from "../API/IDataset"
// import { serializeNode } from "./serializeInstanceData"
// import { serializeMetaData } from "./serializeMetaData"

// class InArray<T> implements astncore.IInArray<T> {
//     private readonly elements: T[]
//     constructor(elements: T[]) {
//         this.elements = elements
//     }
//     isEmpty() {
//         return this.elements.length === 0
//     }
//     map<R>(callback: (element: T) => R) {
//         return new InArray(this.elements.map(e => callback(e)))
//     }

//     forEach(callback: (element: T) => void) {
//         this.elements.forEach(e => callback(e))
//     }
// }

// export function serialize(
//     dataset: id.IDataset,
//     internalSchemaSpecification: id.InternalSchemaSpecification,
// ): p.IStream<string, null> {
//     const rootComments = dataset.rootComments.getComments()
//     const allComments = dataset.documentComments.getComments().concat(rootComments)
//     return astncore.serializeDocument(
//         {
//             schema: serializeMetaData(internalSchemaSpecification, dataset.schema),
//             root: serializeNode(dataset.root),
//             documentComments: new InArray(allComments.map(c => {
//                 return {
//                     text: c.value,
//                 }
//             })),
//         },
//         `    `,
//         true,
//         `\r\n`
//     )
// }
