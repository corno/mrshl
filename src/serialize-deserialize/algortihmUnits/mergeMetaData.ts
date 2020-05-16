import * as g from "../../generics/index"
import * as t from "../types"


function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function mergeDictionaries<T, RT>(left: g.RawObject<T>, right: g.RawObject<T>, callback: (left: T, right: T, key: string) => RT): g.RawObject<RT> {
    const result: g.RawObject<RT> = {}
    const leftKeys = Object.keys(left.properties)
    const rightKeys = Object.keys(right.properties)
    if (rightKeys.length !== leftKeys.length) {
        throw new Error("NOT EQUAL")
    }
    leftKeys.forEach(key => {
        const leftProperty = left[key]
        const rightProperty = right[key]
        if (rightProperty === undefined) {
            throw new Error("MISSING RIGHT PROPERTY")
        }
        result[key] = callback(leftProperty, rightProperty, key)
    })
    return result
}

export function mergeMetaDataNode(left: t.Node, right: t.Node) {
    return {
        properties: mergeDictionaries(left.properties, right.properties, (leftProperty, rightProperty): t.Property => {
            return {
                type: ((): t.PropertyType => {
                    switch (leftProperty.type[0]) {
                        case "collection": {
                            const $ = leftProperty.type[1]
                            if (rightProperty.type[0] !== "collection") {
                                throw new Error("RIGHT PROPERTY IS NOT A COLLECTION")
                            }
                            const r$ = rightProperty.type[1]
                            return ["collection", {
                                "has instances": ((): t.HasInstances => {
                                    switch ($["has instances"][0]) {
                                        case "no": {
                                            //const $$ = $["has instances"][1]
                                            switch (r$["has instances"][0]) {
                                                case "no": {
                                                    //const r$$ = r$["has instances"][1]
                                                    //does not have instances on both sides
                                                    return ["no", {}]
                                                }
                                                case "yes": {
                                                    const r$$ = r$["has instances"][1]
                                                    //has instances on right side only

                                                    return ["yes", {
                                                        node: r$$.node,
                                                    }]
                                                }
                                                default:
                                                    return assertUnreachable(r$["has instances"][0])
                                            }
                                        }
                                        case "yes": {
                                            const $$ = $["has instances"][1]
                                            switch (r$["has instances"][0]) {
                                                case "no": {
                                                    //const r$$ = r$["has instances"][1]
                                                    //has instances on right left only

                                                    return ["yes", {
                                                        node: $$.node,
                                                    }]
                                                }
                                                case "yes": {
                                                    const r$$ = r$["has instances"][1]
                                                    //has instances on both sides
                                                    return ["yes", {
                                                        node: mergeMetaDataNode($$.node, r$$.node),
                                                    }]
                                                }
                                                default:
                                                    return assertUnreachable(r$["has instances"][0])
                                            }
                                        }
                                        default:
                                            return assertUnreachable($["has instances"][0])
                                    }
                                })(),
                            }]
                        }
                        case "component": {
                            const $ = leftProperty.type[1]
                            if (rightProperty.type[0] !== "component") {
                                throw new Error("RIGHT PROPERTY IS NOT A COMPONENT")
                            }
                            const r$ = rightProperty.type[1]
                            console.error("FIXME COMPARE COMPONENT TYPES", $.type, r$.type)
                            return ["component", {
                                type: $.type,
                            }]
                        }
                        case "state group": {
                            const $ = leftProperty.type[1]
                            if (rightProperty.type[0] !== "state group") {
                                throw new Error("RIGHT PROPERTY IS NOT A STATE GROUP")
                            }
                            const r$ = rightProperty.type[1]
                            return ["state group", {
                                states: mergeDictionaries($.states, r$.states, (leftState, rightState) => {
                                    return {
                                        node: mergeMetaDataNode(leftState.node, rightState.node),
                                    }
                                }),
                            }]
                        }
                        case "value": {
                            //const $ = leftProperty.type[1]
                            if (rightProperty.type[0] !== "value") {
                                throw new Error("RIGHT PROPERTY IS NOT A VALUE")
                            }
                            return ["value", {}]
                        }
                        default:
                            return assertUnreachable(leftProperty.type[0])
                    }
                })(),
            }
        }),
    }
}