import * as bc from "bass-clarinet"
import * as internal from "../../../metaDataSchema"
import * as b from "./builders"
import { createDeserializer } from "./deserialize"
import * as g from "./generics"
import { Schema, Node, Property } from "./types"

export * from "./types"

export function attachSchemaDeserializer(parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (dataset: b.DatasetBuilder | null) => void) {
    attachSchemaDeserializer2(parser, onError, schema => {
        if (schema === null) {
            callback(null)
        } else {
            callback(new b.DatasetBuilder(schema, convert(schema)))
        }
    })
}

export function attachSchemaDeserializer2(parser: bc.Parser, onError: (message: string, range: bc.Range) => void, callback: (schema: Schema | null) => void) {
    let foundError = false
    function onSchemaError(message: string, range: bc.Range) {
        onError(message, range)
        foundError = true
    }
    let metaData: null | Schema = null

    parser.ondata.subscribe(bc.createStackedDataSubscriber(
        {
            valueHandler: {
                array: openData => {
                    onSchemaError("unexpected array as schema", openData.range)
                    return bc.createDummyArrayHandler()
                },
                object: createDeserializer(
                    (errorMessage, range) => {
                        onSchemaError(errorMessage, range)
                    },
                    md => {
                        metaData = md
                    }
                ),
                simpleValue: (_value, svData) => {
                    onSchemaError("unexpected string as schema", svData.range)
                },
                taggedUnion: tuData => {
                    onSchemaError("unexpected typed union as schema", tuData.range)
                    return {
                        option: () => bc.createDummyRequiredValueHandler(),
                        missingOption: () => {
                            //
                        },
                    }
                },
            },
            onMissing: () => {
                //
            },
        },
        error => {
            onSchemaError(error.rangeLessMessage, error.range)
        },
        () => {
            if (metaData === null) {
                if (!foundError) {
                    throw new Error("UNEXPECTED: NO SCHEMA AND NO ERRORS")
                }
                callback(null)
            } else {
                callback(metaData)
            }
        }
    ))
}

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function convertNode(node: Node, componentTypes: g.IReadonlyLookup<internal.ComponentType>, keyProperty: null | Property, resolveRegistry: g.ResolveRegistry): internal.Node {
    const properties = new g.Dictionary<internal.Property>({})
    node.properties.mapUnsorted((prop, key) => {
        if (prop === keyProperty) {
            //return
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
                                                "node": targetNode,
                                                "key property": g.createReference($$["key property"].getName(), targetNode.properties, resolveRegistry, keys => {
                                                    throw new Error(`UNEXPECTED: KEY Property not found: ${$$["key property"].getName()}, available keys: ${keys}`);
                                                }),
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
                        const states = new g.Dictionary($.states.mapUnsorted(state => {
                            return {
                                node: convertNode(state.node, componentTypes, null, resolveRegistry),
                            }
                        }))
                        return ["state group", {
                            "states": states,
                            "default state": g.createReference($["default state"].getName(), states, resolveRegistry, keys => {
                                throw new Error(`UNEXPECTED: KEY state not found: ${$["default state"].getName()}, available keys: ${keys}`);
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