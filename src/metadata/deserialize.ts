/* eslint
    quote-props: "off",

*/
import * as bc from "bass-clarinet"
import * as g from "./generics"
import * as t from "./types"

function assertIsDeserialized<T>(v: T | null, callback: (t: T) => void) {
    if (v !== null) {
        callback(v)
    }
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
                                                                                        assertIsDeserialized(targetNode, assertedTargetNode => {
                                                                                            assertIsDeserialized(targetKeyProperty, assertedTargetKeyProperty => {
                                                                                                assertIsDeserialized(targetKeyPropertyRange, atkpr => {
                                                                                                    targetHasInstances = ["yes", {
                                                                                                        "node": assertedTargetNode,
                                                                                                        "key property": g.createReference(
                                                                                                            assertedTargetKeyProperty,
                                                                                                            assertedTargetNode.properties,
                                                                                                            () => {
                                                                                                                throw new bc.RangeError(
                                                                                                                    `key property '${assertedTargetKeyProperty}' not found `,
                                                                                                                    atkpr,
                                                                                                                )
                                                                                                            }
                                                                                                        ),
                                                                                                    }]

                                                                                                })
                                                                                            })
                                                                                        })
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
                                                                    assertIsDeserialized(targetHasInstances, asserted => {
                                                                        targetCollectionType = ["dictionary", {
                                                                            "has instances": asserted,
                                                                        }]
                                                                    })
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
                                                                                    assertIsDeserialized(targetNode, asserted => {
                                                                                        targetHasInstances = ["yes", {
                                                                                            node: asserted,
                                                                                        }]
                                                                                    })
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
                                                                    assertIsDeserialized(targetHasInstances, asserted => {
                                                                        targetCollectionType = ["list", {
                                                                            "has instances": asserted,
                                                                        }]
                                                                    })
                                                                },
                                                            )
                                                        },
                                                    }
                                                ),
                                            },
                                            () => {
                                                assertIsDeserialized(targetCollectionType, asserted => {
                                                    targetPropertyType = ["collection", {
                                                        "type": asserted,
                                                    }]
                                                })
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
                                                assertIsDeserialized(targetComponentTypeName, assertedTargetComponentTypeName => {
                                                    assertIsDeserialized(targetComponentTypeNameRange, assertedRange => {
                                                        targetPropertyType = ["component", {
                                                            "type": g.createReference(
                                                                assertedTargetComponentTypeName,
                                                                componentTypes,
                                                                () => {
                                                                    throw new bc.RangeError(
                                                                        `component type '${assertedTargetComponentTypeName}' not found`,
                                                                        assertedRange
                                                                    )
                                                                },
                                                            ),
                                                        }]

                                                    })

                                                })
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
                                                            assertIsDeserialized(targetNode, asserted => {
                                                                states.add(stateKey, {
                                                                    node: asserted,
                                                                })
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
                                                assertIsDeserialized(targetValueType, asserted => {
                                                    targetPropertyType = ["value", {
                                                        "type": asserted,
                                                    }]
                                                })
                                            },
                                        )
                                    },
                                }
                            ),
                        },
                        () => {
                            assertIsDeserialized(targetPropertyType, asserted => {
                                properties.add(key, {
                                    type: asserted,
                                })
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

export function createDeserializer(onError: (message: string, range: bc.Range) => void, callback: (metaData: t.Schema) => void): bc.OnObject {
    const componentTypes = new g.Dictionary<t.ComponentType>({})
    let rootName: string | null = null
    let rootNameRange: bc.Range | null = null

    const context = new bc.ExpectContext(
        (_errorMessage, _range) => {
            onError(_errorMessage, _range)
        },
        _warningMessage => {
            //ignore
        }
    )

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
                            assertIsDeserialized(targetNode, asserted => {
                                componentTypes.add(key, {
                                    node: asserted,
                                })
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
            assertIsDeserialized(rootName, assertedRootName => {
                assertIsDeserialized(rootNameRange, assertedRange => {
                    callback({
                        "component types": componentTypes,
                        "root type": g.createReference(
                            assertedRootName,
                            componentTypes,
                            () => {
                                throw new bc.RangeError(`component type '${assertedRootName}' not found`, assertedRange)
                            }
                        ),
                    })
                })
            })
        }
    )
}
