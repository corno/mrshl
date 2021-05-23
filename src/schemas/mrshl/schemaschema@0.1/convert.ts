import * as md from "../../../types"
import * as g from "../../../generics"
import { Schema, Node, Property } from "./types"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function convertNode(node: Node, componentTypes: g.IReadonlyLookup<md.ComponentType>, keyProperty: null | Property, resolveRegistry: g.ResolveRegistry): md.Node {
    const properties = new g.Dictionary<md.Property>({})
    node.properties.mapSorted((prop, key) => {
        if (prop === keyProperty) {
            //return
        }
        properties.add(key, {
            type: ((): md.PropertyType => {
                switch (prop.type[0]) {
                    case "collection": {
                        const $ = prop.type[1]

                        return ["collection", {

                            type: ((): md.CollectionType => {
                                switch ($.type[0]) {
                                    case "dictionary": {
                                        const $$ = $.type[1]
                                        const targetNode = convertNode($.node, componentTypes, $$["key property"].get(), resolveRegistry)
                                        return ["dictionary", {
                                            "node": targetNode,
                                            "key property": g.createReference($$["key property"].name, targetNode.properties, resolveRegistry, keys => {
                                                throw new Error(`UNEXPECTED: KEY Property not found: ${$$["key property"].name}, available keys: ${keys.join()}`);
                                            }),
                                        }]
                                    }
                                    case "list": {
                                        const targetNode = convertNode($.node, componentTypes, null, resolveRegistry)
                                        return ["list", {
                                            node: targetNode,
                                        }]
                                    }
                                    default:
                                        return assertUnreachable($.type[0])
                                }
                            })(),
                        }]
                    }
                    case "component": {
                        const $ = prop.type[1]
                        return ["component", {
                            type: g.createReference($.type.name, componentTypes, resolveRegistry, () => {
                                throw new Error("UNEXPECTED")
                            }),
                        }]
                    }
                    case "state group": {
                        const $ = prop.type[1]
                        const states = new g.Dictionary($.states.mapSorted(state => {
                            return {
                                node: convertNode(state.node, componentTypes, null, resolveRegistry),
                            }
                        }))
                        return ["state group", {
                            "states": states,
                            "default state": g.createReference($["default state"].name, states, resolveRegistry, keys => {
                                throw new Error(`UNEXPECTED: KEY state not found: ${$["default state"].name}, available keys: ${keys.join()}`);
                            }),
                        }]
                    }
                    case "value": {
                        const $ = prop.type[1]
                        return ["value", {
                            "default value": $["default value"],
                            "quoted": ((): boolean => {
                                switch ($.type[0]) {
                                    case "boolean":
                                        return false
                                    case "number":
                                        return false
                                    case "string":
                                        return true

                                    default:
                                        return assertUnreachable($.type[0])
                                }
                            })(),
                        }]
                    }
                    default:
                        return assertUnreachable(prop.type[0])
                }
            })(),
        })
    })
    return {
        properties: properties,
    }
}

export function convert(schema: Schema): md.Schema {
    const resolveRegistry = new g.ResolveRegistry()
    const componentTypes: g.Dictionary<md.ComponentType> = new g.Dictionary({})
    schema["component types"].forEach((ct, ctName) => {
        componentTypes.add(ctName, {
            node: convertNode(ct.node, componentTypes, null, resolveRegistry),
        })
    })
    const rootType = g.createReference(schema["root type"].name, componentTypes, resolveRegistry, () => {
        throw new Error("UNEXPECTED")
    })
    const success = resolveRegistry.resolve()
    if (!success) {
        throw new Error("UNEXPECTED")
    }
    return {
        "component types": componentTypes,
        "root type": rootType,
    }
}