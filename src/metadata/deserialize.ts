/* eslint
    quote-props: "off",

*/
import * as bc from "bass-clarinet"
import * as g from "./generics"
import * as t from "./types"

function assertIsDeserialized<T>(v: T | null) {
    if (v === null) {
        throw new Error("value was not deserialized")
    }
    return v
}

function deserializeMetaNode(context: bc.ExpectContext, componentTypes: g.IReadonlyDictionary<t.ComponentType>, callback: (node: t.Node) => void): bc.ValueHandler {
    const properties = new g.Dictionary<t.Property>({})
    return context.expectType(
        _startRange => {
            //
        },
        {
            "properties": () => context.expectDictionary(
                key => {
                    let targetPropertyType: t.PropertyType | null = null
                    return context.expectType(
                        _startRange => {
                            //
                        },
                        {
                            "type": () => context.expectTaggedUnion(
                                {
                                    "collection": () => {
                                        let targetCollectionType: t.CollectionType | null = null
                                        return context.expectType(
                                            _startRange => {
                                                //
                                            },
                                            {
                                                "type": () => context.expectTaggedUnion(
                                                    {
                                                        "dictionary": () => {
                                                            let targetHasInstances: t.DictionaryHasInstances | null = null
                                                            return context.expectType(
                                                                _startRange => {
                                                                    //
                                                                },
                                                                {
                                                                    "has instances": () => context.expectTaggedUnion(
                                                                        {
                                                                            "yes": () => {
                                                                                let targetNode: t.Node | null = null
                                                                                let targetKeyProperty: string | null = null
                                                                                let targetKeyPropertyRange: bc.Range | null = null
                                                                                return context.expectType(
                                                                                    _startRange => {
                                                                                        //
                                                                                    },
                                                                                    {
                                                                                        "node": () => deserializeMetaNode(context, componentTypes, node => targetNode = node),
                                                                                        "key property": () => context.expectString((sourceKeyProperty, range) => {
                                                                                            targetKeyProperty = sourceKeyProperty
                                                                                            targetKeyPropertyRange = range
                                                                                        }),
                                                                                    },
                                                                                    () => {
                                                                                        const assertedTargetNode = assertIsDeserialized(targetNode)
                                                                                        const assertedTargetKeyProperty = assertIsDeserialized(targetKeyProperty)
                                                                                        targetHasInstances = ["yes", {
                                                                                            "node": assertedTargetNode,
                                                                                            "key property": g.createReference(
                                                                                                assertedTargetKeyProperty,
                                                                                                assertedTargetNode.properties,
                                                                                                () => {
                                                                                                    throw new bc.RangeError(
                                                                                                        `key property '${assertedTargetKeyProperty}' not found `,
                                                                                                        assertIsDeserialized(targetKeyPropertyRange),
                                                                                                    )
                                                                                                }
                                                                                            ),
                                                                                        }]
                                                                                    }
                                                                                )
                                                                            },
                                                                            "no": () => {
                                                                                targetHasInstances = ["no", {}]
                                                                                return context.expectType(
                                                                                    _startRange => {
                                                                                        //
                                                                                    },
                                                                                    {},
                                                                                    () => {
                                                                                        //
                                                                                    })
                                                                            },
                                                                        }
                                                                    ),
                                                                },
                                                                () => {
                                                                    targetCollectionType = ["dictionary", {
                                                                        "has instances": assertIsDeserialized(targetHasInstances),
                                                                    }]
                                                                }
                                                            )
                                                        },
                                                        "list": () => {
                                                            let targetHasInstances: t.ListHasInstances | null = null
                                                            return context.expectType(
                                                                _startRange => {
                                                                    //
                                                                },
                                                                {
                                                                    "has instances": () => context.expectTaggedUnion({
                                                                        "yes": () => {
                                                                            let targetNode: t.Node | null = null
                                                                            return context.expectType(
                                                                                _startRange => {
                                                                                    //
                                                                                },
                                                                                {
                                                                                    "node": () => deserializeMetaNode(context, componentTypes, node => targetNode = node),
                                                                                },
                                                                                () => {

                                                                                    targetHasInstances = ["yes", {
                                                                                        node: assertIsDeserialized(targetNode),
                                                                                    }]
                                                                                },
                                                                            )
                                                                        },
                                                                        "no": () => {
                                                                            targetHasInstances = ["no", {}]
                                                                            return context.expectType(
                                                                                _startRange => {
                                                                                    //
                                                                                },
                                                                                {},
                                                                                () => {
                                                                                    //
                                                                                })
                                                                        },
                                                                    }),
                                                                },
                                                                () => {
                                                                    targetCollectionType = ["list", {
                                                                        "has instances": assertIsDeserialized(targetHasInstances),
                                                                    }]
                                                                },
                                                            )
                                                        },
                                                    }
                                                ),
                                            },
                                            () => {
                                                targetPropertyType = ["collection", {
                                                    "type": assertIsDeserialized(targetCollectionType),
                                                }]
                                            },
                                        )

                                    },
                                    "component": () => {
                                        let targetComponentTypeName: string | null = null
                                        let targetComponentTypeNameRange: bc.Range | null = null
                                        return context.expectType(
                                            _startRange => {
                                                //
                                            },
                                            {
                                                "type": () => context.expectString((sourceComponentTypeName, range) => {
                                                    targetComponentTypeName = sourceComponentTypeName
                                                    targetComponentTypeNameRange = range
                                                }),
                                            },
                                            () => {
                                                const assertedTargetComponentTypeName = assertIsDeserialized(targetComponentTypeName)
                                                targetPropertyType = ["component", {
                                                    "type": g.createReference(
                                                        assertedTargetComponentTypeName,
                                                        componentTypes,
                                                        () => {
                                                            throw new bc.RangeError(
                                                                `component type '${assertedTargetComponentTypeName}' not found`,
                                                                assertIsDeserialized(targetComponentTypeNameRange)
                                                            )
                                                        },
                                                    ),
                                                }]
                                            },
                                        )
                                    },
                                    "state group": () => {
                                        const states = new g.Dictionary<t.State>({})
                                        return context.expectType(
                                            _startRange => {
                                                //
                                            },
                                            {
                                                "states": () => context.expectDictionary(stateKey => {
                                                    let targetNode: t.Node | null = null
                                                    return context.expectType(
                                                        _startRange => {
                                                            //
                                                        },
                                                        {
                                                            "node": () => deserializeMetaNode(context, componentTypes, node => targetNode = node),
                                                        },
                                                        () => {
                                                            states.add(stateKey, {
                                                                node: assertIsDeserialized(targetNode),
                                                            })
                                                        },
                                                    )
                                                }),
                                            },
                                            () => {
                                                targetPropertyType = ["state group", {
                                                    "states": states,
                                                }]
                                            },
                                        )
                                    },
                                    "value": () => {
                                        let targetValueType: t.ValueType | null = null
                                        return context.expectType(
                                            _startRange => {
                                                //
                                            },
                                            {
                                                "type": () => context.expectTaggedUnion({
                                                    "number": () => {
                                                        targetValueType = ["number", {}]
                                                        return context.expectType(
                                                            _startRange => {
                                                                //
                                                            },
                                                            {},
                                                            () => {
                                                                //
                                                            })
                                                    },
                                                    "text": () => {
                                                        targetValueType = ["string", {}]
                                                        return context.expectType(
                                                            _startRange => {
                                                                //
                                                            },
                                                            {},
                                                            () => {
                                                                //
                                                            })
                                                    },
                                                }),
                                            },
                                            () => {
                                                targetPropertyType = ["value", {
                                                    "type": assertIsDeserialized(targetValueType),
                                                }]
                                            },
                                        )
                                    },
                                }
                            ),
                        },
                        () => {
                            properties.add(key, {
                                type: assertIsDeserialized(targetPropertyType),
                            })
                        }
                    )
                }
            ),
        },
        () => {
            callback({ properties: properties })
        }
    )
}

export function createDeserializer(callback: (metaData: t.Schema) => void): bc.OnObject {
    const componentTypes = new g.Dictionary<t.ComponentType>({})
    let rootName: string | null = null
    let rootNameRange: bc.Range | null = null

    const context = new bc.ExpectContext(null, null)

    return context.createTypeHandler(
        _startRange => {
            //
        },
        {
            "component types": () => context.expectDictionary(
                key => {
                    let targetNode: t.Node | null = null
                    const vh = deserializeMetaNode(context, componentTypes, node => targetNode = node)
                    const castValueHandler = vh
                    return context.expectType(
                        _startRange => {
                            //
                        },
                        {
                            "node": () => castValueHandler,
                        },
                        () => {
                            componentTypes.add(key, {
                                node: assertIsDeserialized(targetNode),
                            })
                        },
                    )
                },
            ),
            "root type": () => context.expectString((sourceRootName, range) => {
                rootName = sourceRootName
                rootNameRange = range
            }),
        },
        () => {
            const assertedRootName = assertIsDeserialized(rootName)
            callback({
                "component types": componentTypes,
                "root type": g.createReference(
                    assertedRootName,
                    componentTypes,
                    () => {
                        throw new bc.RangeError(`component type '${assertedRootName}' not found`, assertIsDeserialized(rootNameRange))
                    }
                ),
            })
        }
    )
}
