/* eslint
    quote-props: "off",

*/
import * as bc from "bass-clarinet-typed"
import * as g from "./generics"
import * as t from "./types"

/**
 * this function is only calls back if the value is not null
 * @param value value
 * @param callback
 */
function callbackIfNotNull<T>(value: T | null, callback: (t: T) => void) {
    if (value !== null) {
        callback(value)
    }
}


type StringAndStringData = {
    value: string
    data: bc.StringData
}

function deserializeMetaNode(context: bc.ExpectContext, componentTypes: g.IReadonlyDictionary<t.ComponentType>, callback: (node: t.Node) => void, resolveRegistry: g.ResolveRegistry): bc.ValueHandler {
    const properties = new g.Dictionary<t.Property>({})
    return context.expectType(
        _startRange => {
            //
        },
        {
            "properties": {
                onExists: () => context.expectDictionary(
                    () => {
                        //
                    },
                    key => {
                        let targetPropertyType: t.PropertyType | null = null
                        return context.expectType(
                            _startRange => {
                                //
                            },
                            {
                                "type": {
                                    onExists: () => context.expectTaggedUnion(
                                        {
                                            "collection": () => {
                                                let targetCollectionType: t.CollectionType | null = null
                                                let targetNode: t.Node | null = null

                                                return context.expectType(
                                                    _startRange => {
                                                        //
                                                    },
                                                    {
                                                        "node": {
                                                            onExists: () => deserializeMetaNode(context, componentTypes, node => targetNode = node, resolveRegistry),
                                                            onNotExists: null,
                                                        },
                                                        "type": {
                                                            onExists: () => context.expectTaggedUnion(
                                                                {
                                                                    "dictionary": () => {
                                                                        let targetKeyProperty: StringAndStringData | null = null
                                                                        return context.expectType(
                                                                            _startRange => {
                                                                                //
                                                                            },
                                                                            {
                                                                                "key property": {
                                                                                    onExists: () => context.expectSimpleValue((sourceKeyProperty, metaData) => {
                                                                                        targetKeyProperty = {
                                                                                            value: sourceKeyProperty,
                                                                                            data: metaData,
                                                                                        }
                                                                                    }),
                                                                                    onNotExists: null,
                                                                                },
                                                                            },
                                                                            () => {
                                                                                callbackIfNotNull(targetNode, assertedTargetNode => {

                                                                                    callbackIfNotNull(targetKeyProperty, assertedTargetKeyProperty => {
                                                                                        targetCollectionType = ["dictionary", {
                                                                                            "key property": g.createReference(
                                                                                                assertedTargetKeyProperty.value,
                                                                                                assertedTargetNode.properties,
                                                                                                resolveRegistry,
                                                                                                () => {
                                                                                                    context.raiseError(
                                                                                                        `key property '${assertedTargetKeyProperty}' not found `,
                                                                                                        assertedTargetKeyProperty.data.range,
                                                                                                    )
                                                                                                }
                                                                                            ),
                                                                                        }]

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
                                                            onNotExists: null,
                                                        },
                                                    },
                                                    () => {
                                                        callbackIfNotNull(targetNode, assertedTargetNode => {
                                                            callbackIfNotNull(targetCollectionType, asserted => {
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
                                                let targetComponentTypeName: StringAndStringData | null = null
                                                return context.expectType(
                                                    _startRange => {
                                                        //
                                                    },
                                                    {
                                                        "type": {
                                                            onExists: () => context.expectSimpleValue((sourceComponentTypeName, metaData) => {
                                                                targetComponentTypeName = {
                                                                    value: sourceComponentTypeName,
                                                                    data: metaData,
                                                                }
                                                            }),
                                                            onNotExists: null,
                                                        },
                                                    },
                                                    () => {
                                                        callbackIfNotNull(targetComponentTypeName, assertedTargetComponentTypeName => {
                                                            targetPropertyType = ["component", {
                                                                "type": g.createReference(
                                                                    assertedTargetComponentTypeName.value,
                                                                    componentTypes,
                                                                    resolveRegistry,
                                                                    () => {
                                                                        context.raiseError(
                                                                            `component type '${assertedTargetComponentTypeName}' not found`,
                                                                            assertedTargetComponentTypeName.data.range,
                                                                        )
                                                                    },
                                                                ),
                                                            }]
                                                        })
                                                    },
                                                )
                                            },
                                            "state group": () => {
                                                const states = new g.Dictionary<t.State>({})
                                                let targetDefaultState: null | StringAndStringData = null
                                                return context.expectType(
                                                    _startRange => {
                                                        //
                                                    },
                                                    {
                                                        "states": {
                                                            onExists: () => context.expectDictionary(
                                                                () => {
                                                                    //
                                                                },
                                                                stateKey => {
                                                                    let targetNode: t.Node | null = null
                                                                    return context.expectType(
                                                                        _startRange => {
                                                                            //
                                                                        },
                                                                        {
                                                                            "node": {
                                                                                onExists: () => deserializeMetaNode(context, componentTypes, node => targetNode = node, resolveRegistry),
                                                                                onNotExists: null,
                                                                            },
                                                                        },
                                                                        () => {
                                                                            callbackIfNotNull(targetNode, asserted => {
                                                                                states.add(stateKey, {
                                                                                    node: asserted,
                                                                                })
                                                                            })
                                                                        },
                                                                    )
                                                                },
                                                                () => {
                                                                    //
                                                                },
                                                            ),
                                                            onNotExists: null,
                                                        },
                                                        "default state": {
                                                            onExists: () => context.expectSimpleValue((sourceDefaultState, metaData) => {
                                                                targetDefaultState = {
                                                                    value: sourceDefaultState,
                                                                    data: metaData,
                                                                }
                                                            }),
                                                            onNotExists: null,
                                                        },
                                                    },
                                                    () => {
                                                        callbackIfNotNull(targetDefaultState, assertedTargetDefaultState => {
                                                            targetPropertyType = ["state group", {
                                                                "states": states,
                                                                "default state": g.createReference(
                                                                    assertedTargetDefaultState.value,
                                                                    states,
                                                                    resolveRegistry,
                                                                    () => {
                                                                        context.raiseError(
                                                                            `key property '${assertedTargetDefaultState.value}' not found `,
                                                                            assertedTargetDefaultState.data.range,
                                                                        )
                                                                    }
                                                                ),
                                                            }]

                                                        })
                                                    },
                                                )
                                            },
                                            "value": () => {
                                                let targetValueType: t.ValueType | null = null
                                                let defaultValue: string | null = null
                                                return context.expectType(
                                                    _startRange => {
                                                        //
                                                    },
                                                    {
                                                        "type": {
                                                            onExists: () => context.expectTaggedUnion({
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
                                                            onNotExists: null,
                                                        },
                                                        "default value": {
                                                            onExists: () => context.expectSimpleValue((value, _metaData) => {
                                                                defaultValue = value
                                                            }),
                                                            onNotExists: null,
                                                        },
                                                    },
                                                    () => {
                                                        callbackIfNotNull(targetValueType, assertedTargetValueType => {
                                                            callbackIfNotNull(defaultValue, assertedDefaultValue => {
                                                                targetPropertyType = ["value", {
                                                                    "default value": assertedDefaultValue,
                                                                    "type": assertedTargetValueType,
                                                                }]
                                                            })
                                                        })
                                                    },
                                                )
                                            },
                                        }
                                    ),
                                    onNotExists: null,
                                },
                            },
                            () => {
                                callbackIfNotNull(targetPropertyType, asserted => {
                                    properties.add(key, {
                                        type: asserted,
                                    })
                                })
                            }
                        )
                    },
                    () => {
                        //
                    },
                ),
                onNotExists: null,
            },
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
        },
        () => bc.createDummyArrayHandler(),
        () => bc.createDummyObjectHandler(),
        () => bc.createDummyValueHandler(),
        () => bc.createDummyValueHandler(),
        bc.Severity.warning,
        bc.OnDuplicateEntry.ignore
    )
    const resolveRegistry = new g.ResolveRegistry()

    return context.createTypeHandler(
        _startRange => {
            //
        },
        {
            "component types": {
                onExists: () => context.expectDictionary(
                    () => {
                        //
                    },
                    key => {
                        let targetNode: t.Node | null = null
                        const vh = deserializeMetaNode(context, componentTypes, node => targetNode = node, resolveRegistry)
                        const castValueHandler = vh
                        return context.expectType(
                            _startRange => {
                                //
                            },
                            {
                                "node": {
                                    onExists: () => castValueHandler,
                                    onNotExists: null,
                                },
                            },
                            () => {
                                callbackIfNotNull(targetNode, asserted => {
                                    componentTypes.add(key, {
                                        node: asserted,
                                    })
                                })
                            },
                        )
                    },
                    () => {
                        //
                    },
                ),
                onNotExists: null,
            },
            "root type": {
                onExists: () => context.expectSimpleValue((sourceRootName, svData) => {
                    rootName = sourceRootName
                    rootNameRange = svData.range
                }),
                onNotExists: null,
            },
        },
        () => {
            let schema: t.Schema | null = null
            callbackIfNotNull(
                rootName,
                assertedRootName => {
                    callbackIfNotNull(
                        rootNameRange,
                        assertedRange => {
                            schema = {
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
                        })
                }
            )
            const success = resolveRegistry.resolve()
            if (success) {
                callback(schema)
            } else {
                callback(null)
            }
        }
    )
}
