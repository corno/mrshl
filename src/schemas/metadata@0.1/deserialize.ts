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
                                                                                                    },
                                                                                                    () => {
                                                                                                        unguaranteedAssertIsDeserialized(targetNode, assertedTargetNode => {
                                                                                                            targetHasInstances = ["yes", {
                                                                                                                "node": assertedTargetNode,
                                                                                                            }]
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
                                                                                unguaranteedAssertIsDeserialized(targetHasInstances, asserted => {
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
                                                                                                    unguaranteedAssertIsDeserialized(targetNode, asserted => {
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
                                                                                unguaranteedAssertIsDeserialized(targetHasInstances, asserted => {
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
                                                        unguaranteedAssertIsDeserialized(targetCollectionType, asserted => {
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
                                                        "type": {
                                                            onExists: () => context.expectSimpleValue((sourceComponentTypeName, metaData) => {
                                                                targetComponentTypeName = sourceComponentTypeName
                                                                targetComponentTypeNameRange = metaData.range
                                                            }),
                                                            onNotExists: null,
                                                        },
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
                                                                            unguaranteedAssertIsDeserialized(targetNode, asserted => {
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
                                                return context.expectType(
                                                    _startRange => {
                                                        //
                                                    },
                                                    {
                                                    },
                                                    () => {
                                                        targetPropertyType = ["value", {
                                                            "quoted": true, //FIXME
                                                            "default value": "***", //FIXME
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
                                unguaranteedAssertIsDeserialized(targetPropertyType, asserted => {
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
                                unguaranteedAssertIsDeserialized(targetNode, asserted => {
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
