/* eslint
    quote-props: "off",

*/
import * as bc from "bass-clarinet"
import * as g from "./generics"
import * as t from "./types"

function unguaranteedAssertIsDeserialized<T>(v: T | null, callback: (t: T) => void) {
    if (v !== null) {
        callback(v)
    }
}

function guaranteedAssertIsDeserialized<T>(v: T | null, onNull: () => void, onNotNull: (t: T) => void) {
    if (v !== null) {
        onNotNull(v)
    } else {
        onNull()
    }
}

function deserializeMetaNode(context: bc.ExpectContext, componentTypes: g.IReadonlyDictionary<t.ComponentType>, callback: (node: t.Node) => void, resolveRegistry: g.ResolveRegistry): bc.ValueHandler {
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
                                        let targetNode: t.Node | null = null

                                        return context.expectType(
                                            _startRange => {
                                                //
                                            },
                                            {
                                                "node": () => deserializeMetaNode(context, componentTypes, node => targetNode = node, resolveRegistry),

                                                "type": () => context.expectTaggedUnion(
                                                    {
                                                        "dictionary": () => {
                                                            let targetKeyProperty: string | null = null
                                                            let targetKeyPropertyRange: bc.Range | null = null
                                                            return context.expectType(
                                                                _startRange => {
                                                                    //
                                                                },
                                                                {
                                                                    "key property": () => context.expectString((sourceKeyProperty, range) => {
                                                                        targetKeyProperty = sourceKeyProperty
                                                                        targetKeyPropertyRange = range
                                                                    }),
                                                                },
                                                                () => {
                                                                    unguaranteedAssertIsDeserialized(targetNode, assertedTargetNode => {

                                                                        unguaranteedAssertIsDeserialized(targetKeyProperty, assertedTargetKeyProperty => {
                                                                            unguaranteedAssertIsDeserialized(targetKeyPropertyRange, atkpr => {
                                                                                targetCollectionType = ["dictionary", {
                                                                                    "key property": g.createReference(
                                                                                        assertedTargetKeyProperty,
                                                                                        assertedTargetNode.properties,
                                                                                        resolveRegistry,
                                                                                        () => {
                                                                                            context.raiseError(
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
                                                        "list": () => {
                                                            return context.expectType(
                                                                _startRange => {
                                                                    //
                                                                },
                                                                {
                                                                },
                                                                () => {

                                                                    targetCollectionType = ["list", {
                                                                    }]
                                                                },
                                                            )
                                                        },
                                                    }
                                                ),
                                            },
                                            () => {
                                                unguaranteedAssertIsDeserialized(targetNode, assertedTargetNode => {
                                                    unguaranteedAssertIsDeserialized(targetCollectionType, asserted => {
                                                        targetPropertyType = ["collection", {
                                                            "type": asserted,
                                                            "node": assertedTargetNode,
                                                        }]
                                                    })
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
                                                unguaranteedAssertIsDeserialized(targetComponentTypeName, assertedTargetComponentTypeName => {
                                                    unguaranteedAssertIsDeserialized(targetComponentTypeNameRange, assertedRange => {
                                                        targetPropertyType = ["component", {
                                                            "type": g.createReference(
                                                                assertedTargetComponentTypeName,
                                                                componentTypes,
                                                                resolveRegistry,
                                                                () => {
                                                                    context.raiseError(
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
                                                            "node": () => deserializeMetaNode(context, componentTypes, node => targetNode = node, resolveRegistry),
                                                        },
                                                        () => {
                                                            unguaranteedAssertIsDeserialized(targetNode, asserted => {
                                                                states.add(stateKey, {
                                                                    node: asserted,
                                                                })
                                                            })
                                                        },
                                                    )
                                                }),
                                                "default state": () => context.expectString((_value, _range, _comments) => {
                                                    //
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
                                                "default value": () => context.expectString((_value, _range, _comments) => {
                                                    //
                                                }),
                                            },
                                            () => {
                                                unguaranteedAssertIsDeserialized(targetValueType, asserted => {
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
                            unguaranteedAssertIsDeserialized(targetPropertyType, asserted => {
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

export function createDeserializer(onError: (message: string, range: bc.Range) => void, callback: (metaData: null | t.Schema) => void): bc.OnObject {
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
    const resolveRegistry = new g.ResolveRegistry()

    return context.createTypeHandler(
        _startRange => {
            //
        },
        {
            "component types": () => context.expectDictionary(
                key => {
                    let targetNode: t.Node | null = null
                    const vh = deserializeMetaNode(context, componentTypes, node => targetNode = node, resolveRegistry)
                    const castValueHandler = vh
                    return context.expectType(
                        _startRange => {
                            //
                        },
                        {
                            "node": () => castValueHandler,
                        },
                        () => {
                            unguaranteedAssertIsDeserialized(targetNode, asserted => {
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
            guaranteedAssertIsDeserialized(
                rootName,
                () => {
                    callback(null)
                },
                assertedRootName => {
                    guaranteedAssertIsDeserialized(
                        rootNameRange,
                        () => {
                            callback(null)
                        },
                        assertedRange => {
                            const schema = {
                                "component types": componentTypes,
                                "root type": g.createReference(
                                    assertedRootName,
                                    componentTypes,
                                    resolveRegistry,
                                    () => {
                                        context.raiseError(`component type '${assertedRootName}' not found`, assertedRange)
                                    }
                                ),
                            }
                            const success = resolveRegistry.resolve()
                            if (success) {
                                callback(schema)
                            } else {
                                callback(null)
                            }
                        })
                })
        }
    )
}
