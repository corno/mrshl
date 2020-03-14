import * as bc from "bass-clarinet"
import { Schema, Node, Property } from "./types"
import * as internal from "../../internalSchema"
import { createDeserializer } from "./deserialize"
import { SchemaAndNodeBuilder } from "../../deserializeSchema"
import * as g from "./generics"
import { NodeBuilder } from "./builders"

export function attachSchemaDeserializer(parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: SchemaAndNodeBuilder | null) => void) {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }
    let metadata: null | Schema = null

    parser.ondata.subscribe(bc.createStackedDataSubscriber(
        {
            array: openData => {
                onSchemaError("unexpected array as schema", openData.start)
                return bc.createDummyArrayHandler()
            },
            object: createDeserializer(
                (errorMessage, range) => {
                    onSchemaError(errorMessage, range)
                },
                md => {
                    metadata = md
                }
            ),
            simpleValue: (_value, svData) => {
                onSchemaError("unexpected string as schema", svData.range)
            },
            taggedUnion: (_value, tuData) => {
                onSchemaError("unexpected typed union as schema", tuData.startRange)
                return bc.createDummyValueHandler()
            },
        },
        error => {
            if (error.context[0] === "range") {
                onSchemaError(error.message, error.context[1])
            } else {
                onSchemaError(error.message, { start: error.context[1], end: error.context[1] })
            }
        },
        () => {
            if (metadata === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                callback(null)
            } else {
                callback({
                    schema: convert(metadata),
                    nodeBuilder: new NodeBuilder(metadata["root type"].get().node, onError),
                })
            }
        }
    ))
}

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function convertNode(node: Node, componentTypes: g.IReadonlyLookup<internal.ComponentType>, keyProperty: null | Property, resolveRegistry: g.ResolveRegistry): internal.Node {
    const properties = new g.Dictionary<internal.Property>({})
    node.properties.map((prop, key) => {
        if (prop === keyProperty) {
            return
        }
        properties.add(key, {
            type: ((): internal.PropertyType => {
                switch (prop.type[0]) {
                    case "collection": {
                        const $ = prop.type[1]

                        return ["collection", {

                            type: ((): internal.CollectionType => {
                                switch ($.type[0]) {
                                    case "dictionary": {
                                        const $$ = $.type[1]
                                        const targetNode = convertNode($.node, componentTypes, $$["key property"].get(), resolveRegistry)
                                        return ["dictionary", {
                                            "has instances": ["yes", {
                                                node: targetNode,
                                            }],
                                        }]
                                    }
                                    case "list": {
                                        const targetNode = convertNode($.node, componentTypes, null, resolveRegistry)
                                        return ["list", {
                                            "has instances": ["yes", {
                                                node: targetNode,
                                            }],
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
                            type: g.createReference($.type.getName(), componentTypes, resolveRegistry, () => {
                                throw new Error("UNEXPECTED")
                            }),
                        }]
                    }
                    case "state group": {
                        const $ = prop.type[1]
                        return ["state group", {
                            states: new g.Dictionary($.states.map(state => {
                                return {
                                    node: convertNode(state.node, componentTypes, null, resolveRegistry),
                                }
                            })),
                        }]
                    }
                    case "value": {
                        return ["value", {
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

function convert(schema: Schema): internal.Schema {
    const resolveRegistry = new g.ResolveRegistry()
    const componentTypes: g.Dictionary<internal.ComponentType> = new g.Dictionary({})
    schema["component types"].forEach((ct, ctName) => {
        componentTypes.add(ctName, {
            node: convertNode(ct.node, componentTypes, null, resolveRegistry),
        })
    })
    const rootType = g.createReference(schema["root type"].getName(), componentTypes, resolveRegistry, () => {
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