import * as astncore from "astn-core"
import {
    ResolveRegistry,
    createReference,
} from "./Reference"
import {
    createDictionary, MutableDictionary,
} from "./Dictionary"
import { Schema, Node, Property } from "./types"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function convertToGenericNode(
    node: Node, componentTypes: astncore.IReadonlyLookup<astncore.ComponentTypeDefinition>,
    keyProperty: null | Property,
    resolveRegistry: ResolveRegistry,
): astncore.NodeDefinition {
    const properties = createDictionary<astncore.PropertyDefinition>({})
    node.properties.forEach((prop, key) => {
        if (prop === keyProperty) {
            return
        }
        properties.add(key, {
            type: ((): astncore.PropertyTypeDefinition => {
                switch (prop.type[0]) {
                    case "collection": {
                        const $ = prop.type[1]
                        switch ($.type[0]) {
                            case "dictionary": {
                                const $$ = $.type[1]
                                const targetNode = convertToGenericNode($.node, componentTypes, $$["key property"].get(), resolveRegistry)
                                const foo = $$["key property"].get()
                                if (foo.type[0] !== "value") {
                                    throw new Error("unexpected")
                                }
                                return ["dictionary", {
                                    "node": targetNode,
                                    "key": {
                                        "default value": foo.type[1]["default value"],
                                        "quoted": ((): boolean => {
                                            switch (foo.type[1].type[0]) {
                                                case "boolean":
                                                    return false
                                                case "number":
                                                    return false
                                                case "string":
                                                    return true

                                                default:
                                                    return assertUnreachable(foo.type[1].type[0])
                                            }
                                        })(),

                                    },
                                    // "key property": createReference($$["key property"].name, targetNode.properties, resolveRegistry, keys => {
                                    //     throw new Error(`UNEXPECTED: KEY Property not found: ${$$["key property"].name}, available keys: ${keys.join()}`);
                                    // }),
                                }]
                            }
                            case "list": {
                                const targetNode = convertToGenericNode($.node, componentTypes, null, resolveRegistry)
                                return ["list", {
                                    node: targetNode,
                                }]
                            }
                            default:
                                return assertUnreachable($.type[0])
                        }
                    }
                    case "component": {
                        const $ = prop.type[1]
                        return ["component", {
                            type: createReference($.type.name, componentTypes, resolveRegistry, () => {
                                throw new Error("UNEXPECTED")
                            }),
                        }]
                    }
                    case "state group": {
                        const $ = prop.type[1]
                        const states = createDictionary($.states.map(state => {
                            return {
                                node: convertToGenericNode(state.node, componentTypes, null, resolveRegistry),
                            }
                        }))
                        return ["tagged union", {
                            "options": states,
                            "default option": createReference($["default state"].name, states, resolveRegistry, keys => {
                                throw new Error(`UNEXPECTED: KEY state not found: ${$["default state"].name}, available keys: ${keys.join()}`);
                            }),
                        }]
                    }
                    case "value": {
                        const $ = prop.type[1]
                        return ["simple string", {
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

export function convertToGenericSchema(schema: Schema): astncore.Schema {
    const resolveRegistry = new ResolveRegistry()
    const componentTypes: MutableDictionary<astncore.ComponentTypeDefinition> = createDictionary({})
    schema["component types"].forEach((ct, ctName) => {
        componentTypes.add(ctName, {
            node: convertToGenericNode(ct.node, componentTypes, null, resolveRegistry),
        })
    })
    const rootType = createReference(schema["root type"].name, componentTypes, resolveRegistry, () => {
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