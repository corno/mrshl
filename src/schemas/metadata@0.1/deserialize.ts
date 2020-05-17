/* eslint
    quote-props: "off",

*/
import * as bc from "bass-clarinet-typed"
import * as g from "../../generics"
import * as t from "../../types"

/**
 * this function is only calls back if the value is not null
 * @param value value
 * @param callback
 */
function assertNotNull<T>(value: T | null) {
    if (value !== null) {
        return value
    }
    const err = new Error("unexpected null")
    throw err
}

type StringAndRange = {
    value: string
    range: bc.Range
}

function createNodeHandler(
    context: bc.ExpectContext,
    componentTypes: g.IReadonlyDictionary<t.ComponentType>,
    callback: (node: t.Node) => void,
    resolveRegistry: g.ResolveRegistry
): bc.ExpectedProperty {
    return {
        onExists: () => {

            const properties = new g.Dictionary<t.Property>({})
            return context.expectValue(context.expectType(
                {
                    "properties": {
                        onExists: () => context.expectValue(context.expectDictionary(
                            key => {
                                let targetPropertyType: t.PropertyType | null = null
                                return context.expectValue(context.expectType(
                                    {
                                        "type": {
                                            onExists: () => context.expectValue(
                                                context.expectTaggedUnion(
                                                    {
                                                        "collection": () => {
                                                            let targetCollectionType: t.CollectionType | null = null
                                                            return context.expectValue(context.expectType(
                                                                {
                                                                    "type": {
                                                                        onExists: () => context.expectValue(context.expectTaggedUnion(
                                                                            {
                                                                                "dictionary": () => {
                                                                                    let targetHasInstances: t.DictionaryHasInstances | null = null
                                                                                    return context.expectValue(context.expectType(
                                                                                        {
                                                                                            "has instances": {
                                                                                                onExists: () => context.expectValue(context.expectTaggedUnion(
                                                                                                    {
                                                                                                        "yes": () => {
                                                                                                            let targetNode: t.Node | null = null
                                                                                                            let keyPropertyName: StringAndRange | null = null

                                                                                                            return context.expectValue(context.expectType(
                                                                                                                {
                                                                                                                    "node": createNodeHandler(
                                                                                                                        context,
                                                                                                                        componentTypes,
                                                                                                                        node => targetNode = node,
                                                                                                                        resolveRegistry,
                                                                                                                    ),
                                                                                                                    "key property": {
                                                                                                                        onExists: () => context.expectValue(
                                                                                                                            context.expectSimpleValue((value, stringData) => {
                                                                                                                                keyPropertyName = {
                                                                                                                                    value: value,
                                                                                                                                    range: stringData.range,
                                                                                                                                }
                                                                                                                            })
                                                                                                                        ),
                                                                                                                        onNotExists: beginData => {
                                                                                                                            keyPropertyName = {
                                                                                                                                value: "name",
                                                                                                                                range: beginData.range,
                                                                                                                            }

                                                                                                                        },
                                                                                                                    },
                                                                                                                },
                                                                                                                () => {
                                                                                                                    //
                                                                                                                },
                                                                                                                () => {
                                                                                                                    const assertedTargetNode = assertNotNull(targetNode)
                                                                                                                    const assertedKeyPropertyName = assertNotNull(keyPropertyName)
                                                                                                                    targetHasInstances = ["yes", {
                                                                                                                        "node": assertedTargetNode,
                                                                                                                        "key property": g.createReference(
                                                                                                                            assertedKeyPropertyName.value,
                                                                                                                            assertedTargetNode.properties,
                                                                                                                            resolveRegistry,
                                                                                                                            () => {
                                                                                                                                context.raiseError(
                                                                                                                                    `property '${assertedKeyPropertyName.value}' not found`,
                                                                                                                                    assertedKeyPropertyName.range,
                                                                                                                                )
                                                                                                                            },
                                                                                                                        ),
                                                                                                                    }]
                                                                                                                }
                                                                                                            )
                                                                                                            )
                                                                                                        },
                                                                                                        "no": () => {
                                                                                                            targetHasInstances = ["no", {}]
                                                                                                            return context.expectValue(context.expectType())
                                                                                                        },
                                                                                                    },
                                                                                                    () => {
                                                                                                        //on unexpected option
                                                                                                    },
                                                                                                    () => {
                                                                                                        //on missing option
                                                                                                    }
                                                                                                ),
                                                                                                ),
                                                                                                onNotExists: () => {
                                                                                                    targetHasInstances = ["no", {}]
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                        () => {
                                                                                            //
                                                                                        },
                                                                                        () => {
                                                                                            const asserted = assertNotNull(targetHasInstances)
                                                                                            targetCollectionType = ["dictionary", {
                                                                                                "has instances": asserted,
                                                                                            }]
                                                                                        }
                                                                                    )
                                                                                    )
                                                                                },
                                                                                "list": () => {
                                                                                    let targetHasInstances: t.ListHasInstances | null = null
                                                                                    return context.expectValue(context.expectType(
                                                                                        {
                                                                                            "has instances": {
                                                                                                onExists: () => context.expectValue(context.expectTaggedUnion(
                                                                                                    {
                                                                                                        "yes": () => {
                                                                                                            let targetNode: t.Node | null = null
                                                                                                            return context.expectValue(context.expectType(
                                                                                                                {
                                                                                                                    "node": createNodeHandler(
                                                                                                                        context,
                                                                                                                        componentTypes,
                                                                                                                        node => targetNode = node,
                                                                                                                        resolveRegistry
                                                                                                                    ),
                                                                                                                },
                                                                                                                () => {
                                                                                                                    //
                                                                                                                },
                                                                                                                () => {
                                                                                                                    const asserted = assertNotNull(targetNode)
                                                                                                                    targetHasInstances = ["yes", {
                                                                                                                        node: asserted,
                                                                                                                    }]
                                                                                                                },
                                                                                                            ))
                                                                                                        },
                                                                                                        "no": () => {
                                                                                                            targetHasInstances = ["no", {}]
                                                                                                            return context.expectValue(context.expectType())
                                                                                                        },
                                                                                                    },
                                                                                                    () => {
                                                                                                        //on unexpected option
                                                                                                    },
                                                                                                    () => {
                                                                                                        //on missing option
                                                                                                    }
                                                                                                ),
                                                                                                ),
                                                                                                onNotExists: () => {
                                                                                                    targetHasInstances = ["no", {}]
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                        () => {
                                                                                            //
                                                                                        },
                                                                                        () => {
                                                                                            const asserted = assertNotNull(targetHasInstances)
                                                                                            targetCollectionType = ["list", {
                                                                                                "has instances": asserted,
                                                                                            }]
                                                                                        },
                                                                                    ))
                                                                                },
                                                                            },
                                                                            () => {
                                                                                //on unexpected option
                                                                            },
                                                                            () => {
                                                                                //on missing option
                                                                            }
                                                                        ),
                                                                        ),
                                                                        onNotExists: () => {
                                                                            targetCollectionType = ["list", {
                                                                                "has instances": ["no", {}],
                                                                            }]
                                                                        },
                                                                    },
                                                                },
                                                                () => {
                                                                    //
                                                                },
                                                                () => {
                                                                    const asserted = assertNotNull(targetCollectionType)
                                                                    targetPropertyType = ["collection", {
                                                                        "type": asserted,
                                                                    }]
                                                                },
                                                            )
                                                            )

                                                        },
                                                        "component": () => {
                                                            let targetComponentTypeName: StringAndRange | null = null
                                                            return context.expectValue(context.expectType(
                                                                {
                                                                    "type": {
                                                                        onExists: () => context.expectValue(context.expectSimpleValue((sourceComponentTypeName, metaData) => {
                                                                            targetComponentTypeName = {
                                                                                value: sourceComponentTypeName,
                                                                                range: metaData.range,
                                                                            }
                                                                        })),
                                                                        onNotExists: beginData => {
                                                                            targetComponentTypeName = {
                                                                                value: "",
                                                                                range: beginData.range,
                                                                            }
                                                                        },
                                                                    },
                                                                },
                                                                () => {
                                                                    //
                                                                },
                                                                () => {
                                                                    const assertedTargetComponentTypeName = assertNotNull(targetComponentTypeName)
                                                                    targetPropertyType = ["component", {
                                                                        "type": g.createReference(
                                                                            assertedTargetComponentTypeName.value,
                                                                            componentTypes,
                                                                            resolveRegistry,
                                                                            () => {
                                                                                context.raiseError(
                                                                                    `component type '${assertedTargetComponentTypeName.value}' not found`,
                                                                                    assertedTargetComponentTypeName.range,
                                                                                )
                                                                            },
                                                                        ),
                                                                    }]
                                                                },
                                                            ))
                                                        },
                                                        "state group": () => {
                                                            const states = new g.Dictionary<t.State>({})
                                                            let defaultStateName: null | StringAndRange = null
                                                            return context.expectValue(context.expectType(
                                                                {
                                                                    "states": {
                                                                        onExists: () => context.expectValue(context.expectDictionary(
                                                                            stateKey => {
                                                                                let targetNode: t.Node | null = null
                                                                                return context.expectValue(context.expectType(
                                                                                    {
                                                                                        "node": createNodeHandler(
                                                                                            context,
                                                                                            componentTypes,
                                                                                            node => {
                                                                                                targetNode = node
                                                                                            },
                                                                                            resolveRegistry,
                                                                                        ),
                                                                                    },
                                                                                    () => {
                                                                                        //
                                                                                    },
                                                                                    () => {
                                                                                        const asserted = assertNotNull(targetNode)
                                                                                        states.add(stateKey, {
                                                                                            node: asserted,
                                                                                        })
                                                                                    },
                                                                                ))
                                                                            },
                                                                            () => {
                                                                                //
                                                                            },
                                                                        )),
                                                                        onNotExists: () => {
                                                                            //nothing to do, states already initialized
                                                                        },
                                                                    },
                                                                    "default state": {
                                                                        onExists: () => context.expectValue(context.expectSimpleValue((value, stringData) => {
                                                                            defaultStateName = {
                                                                                value: value,
                                                                                range: stringData.range,
                                                                            }
                                                                        })),
                                                                        onNotExists: beginData => {
                                                                            defaultStateName = {
                                                                                value: "yes",
                                                                                range: beginData.range,
                                                                            }
                                                                        },
                                                                    },
                                                                },
                                                                () => {
                                                                    //
                                                                },
                                                                () => {

                                                                    const assertedDefaultStateName = assertNotNull(defaultStateName)
                                                                    targetPropertyType = ["state group", {
                                                                        "states": states,

                                                                        "default state": g.createReference(
                                                                            assertedDefaultStateName.value,
                                                                            states,
                                                                            resolveRegistry,
                                                                            () => {
                                                                                context.raiseError(
                                                                                    `state '${assertedDefaultStateName.value}' not found`,
                                                                                    assertedDefaultStateName.range,
                                                                                )
                                                                            },
                                                                        ),
                                                                    }]
                                                                },
                                                            ))
                                                        },
                                                        "value": () => {
                                                            let quoted: null | boolean = null
                                                            let defaultValue: null | string = null
                                                            return context.expectValue(
                                                                context.expectType(
                                                                    {
                                                                        "quoted": {
                                                                            onExists: () => context.expectValue(context.expectBoolean(value => {
                                                                                quoted = value
                                                                            })),
                                                                            onNotExists: () => {
                                                                                quoted = true
                                                                            },
                                                                        },
                                                                        "default value": {
                                                                            onExists: () => context.expectValue(context.expectSimpleValue(value => {
                                                                                defaultValue = value
                                                                            })),
                                                                            onNotExists: () => {
                                                                                defaultValue = ""
                                                                            },
                                                                        },
                                                                    },
                                                                    () => {
                                                                        //
                                                                    },
                                                                    () => {
                                                                        const assertedQuoted = assertNotNull(quoted)
                                                                        const assertedDefaultValue = assertNotNull(defaultValue)
                                                                        targetPropertyType = ["value", {
                                                                            "quoted": assertedQuoted,
                                                                            "default value": assertedDefaultValue,
                                                                        }]
                                                                    },
                                                                ),
                                                                () => {
                                                                    targetPropertyType = ["value", {
                                                                        "default value": "",
                                                                        "quoted": true,
                                                                    }]
                                                                }
                                                            )
                                                        },
                                                    },
                                                    () => {
                                                        //on unexpected option
                                                    },
                                                    () => {
                                                        //on missing option
                                                    }
                                                ),
                                                () => {
                                                    //
                                                }
                                            ),
                                            onNotExists: () => {
                                                targetPropertyType = ["value", {
                                                    "default value": "",
                                                    "quoted": true,
                                                }]
                                            },
                                        },
                                    },
                                    () => {
                                        //
                                    },
                                    () => {
                                        //HERE BE DRAGONS
                                        const asserted = assertNotNull(targetPropertyType)
                                        properties.add(key, {
                                            type: asserted,
                                        })
                                    }
                                )
                                )
                            },
                            _endRange => {
                                //registerSnippetGenerators(endRange, "properties end")
                            },
                        ),
                        ),
                        onNotExists: () => {
                            //nothing to do, properties dictionary already initialized
                        },
                    },
                },
                () => {
                    //
                },
                () => {
                    callback({ properties: properties })
                }
            )
            )
        },
        onNotExists: () => {
            callback({
                properties: new g.Dictionary({}),
            })
        },
    }
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
        {
            "component types": {
                onExists: () => context.expectValue(context.expectDictionary(
                    key => {
                        let targetNode: t.Node | null = null
                        return context.expectValue(context.expectType(
                            {
                                "node": createNodeHandler(
                                    context,
                                    componentTypes,
                                    node => {
                                        targetNode = node
                                    },
                                    resolveRegistry
                                ),
                            },
                            () => {
                                //
                            },
                            () => {
                                const asserted = assertNotNull(targetNode)
                                componentTypes.add(key, {
                                    node: asserted,
                                })
                            },
                        ))
                    },
                    _endRange => {
                        //registerSnippetGenerators(endRange, "component types end")
                    },
                )),
                onNotExists: () => {
                    //noting to do, componentTypes dictionary already initialized
                },
            },
            "root type": {
                onExists: () => context.expectValue(context.expectSimpleValue((sourceRootName, metaData) => {
                    rootName = sourceRootName
                    rootNameRange = metaData.range
                })),
                onNotExists: beginData => {
                    rootName = "root"
                    rootNameRange = beginData.range
                },
            },
        },
        () => {
            //
        },
        () => {
            let schema: t.Schema | null = null
            const assertedRootName = assertNotNull(rootName)
            const assertedRange = assertNotNull(rootNameRange)
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
            const success = resolveRegistry.resolve()
            if (success) {
                callback(schema)
            } else {
                callback(null)
            }
        }
    )
}
