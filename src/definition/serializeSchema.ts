// import * as g from "../generics"
// import { Node, Schema } from "./types"

// function serializeNode(node: Node) {
//     const obj: any = {
//         properties: {},
//     }
//     node.properties.forEach((prop, propKey) => {
//         obj.properties[propKey] = [ prop.type[0], (() => {
//             switch (prop.type[0]) {
//                 case "collection": {
//                     const $ = prop.type[1]
//                     return {
//                         node: serializeNode($.node),
//                     }
//                 }
//                 case "component": {
//                     const $ = prop.type[1]
//                     return {
//                         type: $.typename,
//                     }
//                 }
//                 case "value": {
//                     //const $ = prop.type[1]
//                     return {}
//                 }
//                 case "state group": {
//                     const $ = prop.type[1]

//                     const sgObj: any = {
//                         states: {},
//                     }
//                     $.states.forEach((s, stateKey) => {
//                         sgObj.states[stateKey] = {
//                             node: serializeNode(s.node),
//                         }
//                     })
//                     return sgObj
//                 }
//                 default:
//                     return g.assertUnreachable(prop.type[0])
//             }
//         })()]
//     })
//     return obj
// }

// export function serializeSchema(schema: Schema) {
//     const obj: any = {}
//     obj["component types"] = {}
//     schema["component types"].forEach((ct, key) => {
//         obj["component types"][key] = {
//             node: serializeNode(ct.node),
//         }
//     })
//     obj.root = serializeNode(schema.root)
//     return obj
// }
