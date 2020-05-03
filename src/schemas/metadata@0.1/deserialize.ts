/* eslint
    quote-props: "off",

*/
import * as bc from "bass-clarinet"
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

function deserializeMetaNode(
    context: bc.ExpectContext,
    componentTypes: g.IReadonlyDictionary<t.ComponentType>,
    callback: (node: t.Node) => void, resolveRegistry: g.ResolveRegistry): bc.ValueHandler {
    const properties = new g.Dictionary<t.Property>({})
    return context.expectType(
        _startRange => {
            //
        },
        {
            "properties": {
                onExists: () => context.expectDictionary(
                    _beginRange => {
                        //registerSnippetGenerators(beginRange, "properties begin")
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
                                                return context.expectType(
                                                    _startRange => {
                                                        //
                                                    },
                                                    {
                                                        "type": {
                                                            onExists: () => context.expectTaggedUnion(
                                                                {
                                                                    "dictionary": () => {
                                                                        let targetHasInstances: t.DictionaryHasInstances | null = null
                                                                        return context.expectType(
                                                                            _startRange => {
                                                                                //
                                                                            },
                                                                            {
                                                                                "has instances": {
                                                                                    onExists: () => context.expectTaggedUnion(
                                                                                        {
                                                                                            "yes": () => {
                                                                                                let targetNode: t.Node | null = null
                                                                                                let keyPropertyName: StringAndStringData | null = null

                                                                                                return context.expectType(
                                                                                                    _startRange => {
                                                                                                        //
                                                                                                    },
                                                                                                    {
                                                                                                        "node": {
                                                                                                            onExists: () => deserializeMetaNode(
                                                                                                                context,
                                                                                                                componentTypes,
                                                                                                                node => targetNode = node,
                                                                                                                resolveRegistry,
                                                                                                            ),
                                                                                                            onNotExists: null,
                                                                                                        },
                                                                                                        "key property": {
                                                                                                            onExists: () => context.expectSimpleValue((value, stringData) => {
                                                                                                                keyPropertyName = {
                                                                                                                    value: value,
                                                                                                                    data: stringData,
                                                                                                                }
                                                                                                            }),
                                                                                                            onNotExists: null,
                                                                                                        },
                                                                                                    },
                                                                                                    () => {
                                                                                                        callbackIfNotNull(targetNode, assertedTargetNode => {
                                                                                                            callbackIfNotNull(keyPropertyName, assertedKeyPropertyName => {
                                                                                                                targetHasInstances = ["yes", {
                                                                                                                    "node": assertedTargetNode,
                                                                                                                    "key property": g.createReference(
                                                                                                                        assertedKeyPropertyName.value,
                                                                                                                        assertedTargetNode.properties,
                                                                                                                        resolveRegistry,
                                                                                                                        () => {
                                                                                                                            context.raiseError(
                                                                                                                                `property '${assertedKeyPropertyName}' not found`,
                                                                                                                                assertedKeyPropertyName.data.range,
                                                                                                                            )
                                                                                                                        },
                                                                                                                    ),
                                                                                                                }]
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
                                                                                    onNotExists: null,
                                                                                },
                                                                            },
                                                                            () => {
                                                                                callbackIfNotNull(targetHasInstances, asserted => {
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
                                                                                "has instances": {
                                                                                    onExists: () => context.expectTaggedUnion({
                                                                                        "yes": () => {
                                                                                            let targetNode: t.Node | null = null
                                                                                            return context.expectType(
                                                                                                _startRange => {
                                                                                                    //
                                                                                                },
                                                                                                {
                                                                                                    "node": {
                                                                                                        onExists: () => deserializeMetaNode(
                                                                                                            context,
                                                                                                            componentTypes,
                                                                                                            node => targetNode = node, resolveRegistry),
                                                                                                        onNotExists: null,
                                                                                                    },
                                                                                                },
                                                                                                () => {
                                                                                                    callbackIfNotNull(targetNode, asserted => {
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
                                                                                    onNotExists: null,
                                                                                },
                                                                            },
                                                                            () => {
                                                                                callbackIfNotNull(targetHasInstances, asserted => {
                                                                                    targetCollectionType = ["list", {
                                                                                        "has instances": asserted,
                                                                                    }]
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
                                                        callbackIfNotNull(targetCollectionType, asserted => {
                                                            targetPropertyType = ["collection", {
                                                                "type": asserted,
                                                            }]
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
                                                    },
                                                    () => {
                                                        targetPropertyType = ["state group", {
                                                            "states": states,
                                                        }]
                                                    },
                                                )
                                            },
                                            "value": () => {
                                                let quoted: null | boolean = null
                                                let defaultValue: null | string = null
                                                return context.expectType(
                                                    _startRange => {
                                                        //
                                                    },
                                                    {
                                                        "quoted": {
                                                            onExists: () => context.expectBoolean(value => {
                                                                quoted = value
                                                            }),
                                                            onNotExists: null,
                                                        },
                                                        "default value": {
                                                            onExists: () => context.expectSimpleValue(value => {
                                                                defaultValue = value
                                                            }),
                                                            onNotExists: null,
                                                        },
                                                    },
                                                    () => {
                                                        callbackIfNotNull(quoted, assertedQuoted => {
                                                            callbackIfNotNull(defaultValue, assertedDefaultValue => {
                                                                targetPropertyType = ["value", {
                                                                    "quoted": assertedQuoted,
                                                                    "default value": assertedDefaultValue,
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
                    _endRange => {
                        //registerSnippetGenerators(endRange, "properties end")
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
                    _beginRange => {
                        //registerSnippetGenerators(beginRange, "component types begin")
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
                    _endRange => {
                        //registerSnippetGenerators(endRange, "component types end")
                    },
                ),
                onNotExists: null,
            },
            "root type": {
                onExists: () => context.expectSimpleValue((sourceRootName, metaData) => {
                    rootName = sourceRootName
                    rootNameRange = metaData.range
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
