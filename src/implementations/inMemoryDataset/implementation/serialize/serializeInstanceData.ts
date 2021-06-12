import * as astncore from "astn-core"
import { RootImp } from "../Root"
import { Node } from "../internals/Node"
import { NodeDefinition, PropertyDefinition } from "../../../../interfaces/typedParserDefinitions"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}


function nodeIsDefault(node: Node, def: NodeDefinition): boolean {
    let foundNonDefault = false
    def.properties.forEach((propDef, key) => {
        if (!propertyIsDefault(node, key, propDef)) {
            foundNonDefault = true
        }
    })
    return !foundNonDefault
}

function propertyIsDefault(node:  Node, propertyName: string, propertyDef: PropertyDefinition): boolean {
    switch (propertyDef.type[0]) {
        case "component": {
            const $ = propertyDef.type[1]
            return nodeIsDefault(node.components.getUnsafe(propertyName).node, $.type.get().node)
        }
        case "collection": {
            //const $ = propertyDef.type[1]
            return node.collections.getUnsafe(propertyName).entries.isEmpty()
        }
        case "tagged union": {
            const $ = propertyDef.type[1]

            const tu = node.taggedUnions.getUnsafe(propertyName)

            const optionKey = tu.currentState.get().key

            if (tu.currentState.get().key !== $["default option"].name) {
                return false
            }
            return nodeIsDefault(tu.currentState.get().node, $.options.getUnsafe(optionKey).node)
        }
        case "string": {
            const $ = propertyDef.type[1]
            return node.values.getUnsafe(propertyName).value.get() === $["default value"]
        }
        default:
            return assertUnreachable(propertyDef.type[0])
    }
}

export function serializeRoot(root: RootImp): astncore.TreeBuilderEvent<null>[] {
    const events: astncore.TreeBuilderEvent<null>[] = []
    function addEvent(e: astncore.TreeBuilderEventType) {
        //console.error(JSON.stringify(e))
        events.push({
            annotation: null,
            type: e,
        })

    }
    function serializeNode(
        node: Node,
        definition: NodeDefinition,
        keyProp: string | null,
    ) {
        addEvent(["open object", {
            type: ["verbose type"],
        }])
        definition.properties.forEach((propDef, key) => {
            if (key === keyProp) {
                //don't serialize the key property
                return
            }
            if (propertyIsDefault(node, key, propDef)) {
                return
            }
            addEvent(["simple string", {
                value: key,
                wrapping: ["apostrophe", {}],
            }])
            switch (propDef.type[0]) {
                case "collection": {
                    const $ = propDef.type[1]
                    const collection = node.collections.getUnsafe(key)

                    switch ($.type[0]) {
                        case "dictionary": {
                            const $$ = $.type[1]


                            addEvent(["open object", {
                                type: ["dictionary"],
                            }])
                            collection.entries.forEach(e => {
                                addEvent(["simple string", {
                                    value: e.node.values.getUnsafe($$["key property"].name).value.get(),
                                    wrapping: ["quote", {}],
                                }])
                                serializeNode(e.node, $$.node, $$["key property"].name)
                            })
                            addEvent(["close object", {
                                //
                            }])
                            break
                        }
                        case "list": {
                            const $$ = $.type[1]
                            addEvent(["open array", {
                                type: ["list"],
                            }])
                            collection.entries.forEach(e => {
                                serializeNode(e.node, $$.node, null)
                            })
                            addEvent(["close array", {
                                //
                            }])
                            break
                        }
                        default:
                            assertUnreachable($.type[0])
                    }
                    break
                }
                case "component": {
                    const $ = propDef.type[1]
                    serializeNode(node.components.getUnsafe(key).node, $.type.get().node, null)
                    break
                }
                case "tagged union": {
                    const $ = propDef.type[1]
                    addEvent(["tagged union", {}])
                    const sg = node.taggedUnions.getUnsafe(key)
                    addEvent(["simple string", {
                        value: sg.currentStateKey.get(),
                        wrapping: ["apostrophe", {}],
                    }])
                    serializeNode(node.taggedUnions.getUnsafe(key).currentState.get().node, $.options.getUnsafe(sg.currentStateKey.get()).node, null)

                    break
                }
                case "string": {
                    const $ = propDef.type[1]
                    addEvent(["simple string", {
                        value: node.values.getUnsafe(key).value.get(),
                        wrapping: $.quoted
                            ? ["quote", {
                            }]
                            : ["none", {
                            }],
                    }])
                    break
                }
                default:
                    assertUnreachable(propDef.type[0])
            }
        })
        addEvent(["close object", {
            //
        }])
    }
    serializeNode(root.rootNode, root.schema["root type"].get().node, null)
    return events
}

// import * as astncore from "astn-core"
// import * as syncAPI from "../API/syncAPI"

// function assertUnreachable<RT>(_x: never): RT {
//     throw new Error("unreachable")
// }

// class InDictionary<T> implements astncore.IInDictionary<T> {
//     private readonly properties: { [key: string]: T }
//     constructor(properties: { [key: string]: T }) {
//         this.properties = properties
//     }
//     isEmpty() {
//         return Object.keys(this.properties).length === 0
//     }
//     map<R>(callback: (property: T, name: string) => R) {
//         const keys = Object.keys(this.properties)
//         const orderedKeys = keys.sort()
//         return new InArray(orderedKeys.map(e => callback(this.properties[e], e)))
//     }
// }

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

// function createEmptyCommentData(): astncore.SerializableCommentData {
//     return {
//         before: {
//             comments: new InArray([]),
//         },
//         lineCommentAfter: null,
//     }
// }

// function transformCommentData(comments: syncAPI.Comments): astncore.SerializableCommentData {
//     return {
//         before: {
//             comments: new InArray(comments.getComments().map(c => {
//                 return {
//                     text: c.value,
//                 }
//             })),
//         },
//         lineCommentAfter: null,
//     }
// }

// function nodeIsDefault(node: syncAPI.Node): boolean {
//     let foundNonDefault = false
//     node.forEachProperty(prop => {
//         if (!propertyIsDefault(prop)) {
//             foundNonDefault = true
//         }
//     })
//     return !foundNonDefault
// }

// function propertyIsDefault(property: syncAPI.Property): boolean {
//     switch (property.type[0]) {
//         case "component": {
//             const $ = property.type[1]
//             return nodeIsDefault($.node)
//         }
//         case "dictionary": {
//             const $ = property.type[1]
//             return $.isEmpty()
//         }
//         case "list": {
//             const $ = property.type[1]
//             return $.isEmpty()
//         }
//         case "tagged union": {
//             const $ = property.type[1]
//             if ($.getCurrentState().getStateKey() !== $.definition["default state"].name) {
//                 return false
//             }
//             return nodeIsDefault($.getCurrentState().node)
//         }
//         case "string": {
//             const $ = property.type[1]
//             return $.getValue() === $.definition["default value"]
//         }
//         default:
//             return assertUnreachable(property.type[0])
//     }
// }

// function getPropertyComments(prop: syncAPI.Property): syncAPI.Comments {
//     switch (prop.type[0]) {
//         case "component": {
//             const $ = prop.type[1]
//             return $.comments
//         }
//         case "dictionary": {
//             const $ = prop.type[1]
//             return $.comments
//         }
//         case "list": {
//             const $ = prop.type[1]
//             return $.comments
//         }
//         case "tagged union": {
//             const $ = prop.type[1]
//             return $.comments
//         }
//         case "string": {
//             const $ = prop.type[1]
//             return $.comments
//         }
//         default:
//             return assertUnreachable(prop.type[0])
//     }
// }

// function transformProperty(prop: syncAPI.Property): astncore.SerializableValueType {
//     switch (prop.type[0]) {
//         case "component": {
//             const $ = prop.type[1]
//             return transformNodeToValueType($.node)
//         }
//         case "dictionary": {
//             const $ = prop.type[1]

//             const entries: { [key: string]: astncore.SerializableProperty } = {}

//             $.forEachEntry((entry, key) => {
//                 entries[key] = {
//                     commentData: transformCommentData(entry.comments),
//                     quote: "\"",
//                     value: serializeNode(entry.node),
//                 }
//             })
//             return ["object", {
//                 properties: new InDictionary(entries),
//                 openCharacter: "{",
//                 closeCharacter: "}",
//                 commentData: createEmptyCommentData(),
//             }]
//         }
//         case "list": {
//             const $ = prop.type[1]
//             const elements: astncore.SerializableValue[] = []
//             $.forEachEntry(entry => {
//                 elements.push({
//                     commentData: transformCommentData(entry.comments),
//                     type: transformNodeToValueType(entry.node),
//                 })
//             })
//             return ["array", {
//                 elements: new InArray(elements),
//                 openCharacter: "[",
//                 closeCharacter: "]",
//                 commentData: createEmptyCommentData(),
//             }]
//         }
//         case "tagged union": {
//             const $ = prop.type[1]
//             const currentState = $.getCurrentState()
//             return ["tagged union", {
//                 commentData: createEmptyCommentData(),
//                 quote: "'",
//                 option: currentState.getStateKey(),
//                 data: serializeNode(currentState.node),
//             }]
//         }
//         case "string": {
//             const $ = prop.type[1]
//             return ["simple value", {
//                 quote: $.definition.quoted ? "\"" : null,
//                 value: $.getValue(),
//             }]
//         }
//         default:
//             return assertUnreachable(prop.type[0])
//     }
// }

// function transformNodeToValueType(node: syncAPI.Node): astncore.SerializableValueType {

//     const properties: { [key: string]: astncore.SerializableProperty } = {}
//     node.forEachProperty((prop, key) => {
//         if (!propertyIsDefault(prop)) {

//             if (!prop.isKeyProperty) {
//                 properties[key] = {
//                     commentData: transformCommentData(getPropertyComments(prop)),
//                     quote: "'",
//                     value: {
//                         commentData: createEmptyCommentData(),
//                         type: transformProperty(prop),
//                     },
//                 }
//             }
//         }
//     })
//     return ["object", {
//         commentData: createEmptyCommentData(),
//         properties: new InDictionary(properties),
//         openCharacter: `(`,
//         closeCharacter: `)`,
//     }]
// }

// export function serializeNode(node: syncAPI.Node): astncore.SerializableValue {
//     return {
//         commentData: createEmptyCommentData(),
//         type: transformNodeToValueType(node),
//     }
// }