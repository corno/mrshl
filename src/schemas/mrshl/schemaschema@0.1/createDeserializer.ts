/* eslint
    quote-props: "off",

*/
import * as p from "pareto"
import * as bc from "bass-clarinet-typed"
import * as g from "../../../generics"
import * as t from "./types"

/**
 * this function is only calls back if the value is not null
 * @param value value
 * @param callback
 */
function assertNotNull<T>(value: T | null): T {
    if (value !== null) {
        return value
    }
    const err = new Error("unexpected null value")
    throw err
}

type StringAndRange = {
    value: string
    range: bc.Range
}

function createExpectedNodeHandler(
    context: bc.ExpectContext,
    componentTypes: g.IReadonlyDictionary<t.ComponentType>,
    callback: (node: t.Node) => void,
    resolveRegistry: g.ResolveRegistry,
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
                                            onExists: () => context.expectValue(context.expectTaggedUnion(
                                                {
                                                    "collection": () => {
                                                        let targetCollectionType: t.CollectionType | null = null
                                                        let targetNode: t.Node | null = null

                                                        return context.expectValue(context.expectType(
                                                            {
                                                                "node": createExpectedNodeHandler(
                                                                    context,
                                                                    componentTypes,
                                                                    node => {
                                                                        targetNode = node
                                                                    },
                                                                    resolveRegistry,
                                                                ),
                                                                "type": {
                                                                    onExists: () => context.expectValue(context.expectTaggedUnion(
                                                                        {
                                                                            "dictionary": () => {
                                                                                let targetKeyProperty: StringAndRange | null = null
                                                                                return context.expectValue(context.expectType(
                                                                                    {
                                                                                        "key property": {
                                                                                            onExists: () => context.expectValue(context.expectSimpleValue((range, data) => {
                                                                                                targetKeyProperty = {
                                                                                                    value: data.value,
                                                                                                    range: range,
                                                                                                }
                                                                                                return p.result(false)
                                                                                            })),
                                                                                            onNotExists: range => {
                                                                                                targetKeyProperty = {
                                                                                                    value: "name",
                                                                                                    range: range,
                                                                                                }
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    () => {
                                                                                        //
                                                                                    },
                                                                                    () => {
                                                                                        const assertedTargetNode = assertNotNull(targetNode)

                                                                                        const assertedTargetKeyProperty = assertNotNull(targetKeyProperty)
                                                                                        targetCollectionType = ["dictionary", {
                                                                                            "key property": g.createReference(
                                                                                                assertedTargetKeyProperty.value,
                                                                                                assertedTargetNode.properties,
                                                                                                resolveRegistry,
                                                                                                () => {
                                                                                                    context.raiseError(
                                                                                                        `key property '${assertedTargetKeyProperty.value}' not found `,
                                                                                                        assertedTargetKeyProperty.range,
                                                                                                    )
                                                                                                }
                                                                                            ),
                                                                                        }]

                                                                                    }
                                                                                ))
                                                                            },
                                                                            "list": () => {
                                                                                targetCollectionType = ["list", {
                                                                                }]
                                                                                return context.expectValue(context.expectType())
                                                                            },
                                                                        },
                                                                        () => {
                                                                            //on unexpected option
                                                                        },
                                                                        () => {
                                                                            //on missing option
                                                                        }
                                                                    )),
                                                                    onNotExists: () => {
                                                                        targetCollectionType = ["list", {}]
                                                                    },
                                                                },
                                                            },
                                                            () => {
                                                                //
                                                            },
                                                            () => {
                                                                const assertedTargetNode = assertNotNull(targetNode)
                                                                const asserted = assertNotNull(targetCollectionType)
                                                                targetPropertyType = ["collection", {
                                                                    "type": asserted,
                                                                    "node": assertedTargetNode,
                                                                }]
                                                            },
                                                        ))
                                                    },
                                                    "component": () => {
                                                        let targetComponentTypeName: StringAndRange | null = null
                                                        return context.expectValue(context.expectType(
                                                            {
                                                                "type": {
                                                                    onExists: () => context.expectValue(context.expectSimpleValue((range, data) => {
                                                                        targetComponentTypeName = {
                                                                            value: data.value,
                                                                            range: range,
                                                                        }
                                                                        return p.result(false)
                                                                    })),
                                                                    onNotExists: range => {
                                                                        targetComponentTypeName = {
                                                                            value: "",
                                                                            range: range,
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
                                                        let targetDefaultState: null | StringAndRange = null
                                                        return context.expectValue(context.expectType(
                                                            {
                                                                "states": {
                                                                    onExists: () => context.expectValue(context.expectDictionary(
                                                                        stateKey => {
                                                                            let targetNode: t.Node | null = null
                                                                            return context.expectValue(context.expectType(
                                                                                {
                                                                                    "node": createExpectedNodeHandler(
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
                                                                    )),
                                                                    onNotExists: () => {
                                                                        //nothing to do, states dictionary already initialized
                                                                    },
                                                                },
                                                                "default state": {
                                                                    onExists: () => context.expectValue(context.expectSimpleValue((range, data) => {
                                                                        targetDefaultState = {
                                                                            value: data.value,
                                                                            range: range,
                                                                        }
                                                                        return p.result(false)
                                                                    })),
                                                                    onNotExists: range => {
                                                                        targetDefaultState = {
                                                                            value: "yes",
                                                                            range: range,
                                                                        }
                                                                    },
                                                                },
                                                            },
                                                            () => {
                                                                //
                                                            },
                                                            () => {
                                                                const assertedTargetDefaultState = assertNotNull(targetDefaultState)
                                                                targetPropertyType = ["state group", {
                                                                    "states": states,
                                                                    "default state": g.createReference(
                                                                        assertedTargetDefaultState.value,
                                                                        states,
                                                                        resolveRegistry,
                                                                        () => {
                                                                            context.raiseError(
                                                                                `key property '${assertedTargetDefaultState.value}' not found `,
                                                                                assertedTargetDefaultState.range,
                                                                            )
                                                                        }
                                                                    ),
                                                                }]

                                                            },
                                                        ))
                                                    },
                                                    "value": () => {
                                                        let targetValueType: t.ValueType | null = null
                                                        let defaultValue: string | null = null
                                                        return context.expectValue(context.expectType(
                                                            {
                                                                "type": {
                                                                    onExists: () => context.expectValue(context.expectTaggedUnion(
                                                                        {
                                                                            "number": () => {
                                                                                targetValueType = ["number", {}]
                                                                                return context.expectValue(context.expectType())
                                                                            },
                                                                            "text": () => {
                                                                                targetValueType = ["string", {}]
                                                                                return context.expectValue(context.expectType())
                                                                            },
                                                                        },
                                                                        () => {
                                                                            //on unexpected option
                                                                        },
                                                                        () => {
                                                                            //on missing option
                                                                        }
                                                                    )),
                                                                    onNotExists: () => {
                                                                        targetValueType = ["string", {}]
                                                                    },
                                                                },
                                                                "default value": {
                                                                    onExists: () => context.expectValue(context.expectSimpleValue((_range, data) => {
                                                                        defaultValue = data.value
                                                                        return p.result(false)
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
                                                                const assertedTargetValueType = assertNotNull(targetValueType)
                                                                const assertedDefaultValue = assertNotNull(defaultValue)
                                                                targetPropertyType = ["value", {
                                                                    "default value": assertedDefaultValue,
                                                                    "type": assertedTargetValueType,
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
                                            )),
                                            onNotExists: () => {
                                                targetPropertyType = ["value", {
                                                    "default value": "",
                                                    "type": ["string", {}],
                                                }]
                                            },
                                        },
                                    },
                                    () => {
                                        //
                                    },
                                    () => {
                                        const asserted = assertNotNull(targetPropertyType)
                                        properties.add(key, {
                                            type: asserted,
                                        })
                                    }
                                ))
                            },
                            () => {
                                //
                            },
                        )),
                        onNotExists: () => {
                            //nothing to do, properties dictionary already created
                        },
                    },
                },
                () => {
                    //
                },
                () => {
                    callback({ properties: properties })
                }
            ))
        },
        onNotExists: () => {
            callback({
                properties: new g.Dictionary<t.Property>({}),
            })
        },
    }
}

export function createDeserializer(onError: (message: string, range: bc.Range) => void, callback: (metaData: null | t.Schema) => void): bc.OnObject {
    const componentTypes = new g.Dictionary<t.ComponentType>({})
    let rootName: StringAndRange | null = null

    const context = new bc.ExpectContext(
        (_errorMessage, _range) => {
            onError(_errorMessage, _range)
        },
        _warningMessage => {
            //ignore
        },
        () => bc.createDummyValueHandler(),
        () => bc.createDummyValueHandler(),
        bc.Severity.warning,
        bc.OnDuplicateEntry.ignore
    )
    const resolveRegistry = new g.ResolveRegistry()

    return context.createTypeHandler(
        {
            "component types": {
                onExists: (): bc.RequiredValueHandler => context.expectValue(context.expectDictionary(
                    key => {
                        let targetNode: t.Node | null = null
                        return context.expectValue(context.expectType(
                            {
                                "node": createExpectedNodeHandler(
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
                                componentTypes.add(key, {
                                    node: asserted,
                                })
                            },
                        ))
                    },
                )),
                onNotExists: (): void => {
                    //nothing to do, component types already initialized
                },
            },
            "root type": {
                onExists: (): bc.RequiredValueHandler => context.expectValue(context.expectSimpleValue((range, svData) => {
                    rootName = {
                        value: svData.value,
                        range: range,
                    }
                    return p.result(false)

                })),
                onNotExists: (range: bc.Range): void => {
                    rootName = {
                        value: "root",
                        range: range,
                    }
                },
            },
        },
        () => {
            //
        },
        () => {
            let schema: t.Schema | null = null
            const assertedRootName = assertNotNull(rootName)
            schema = {
                "component types": componentTypes,
                "root type": g.createReference(
                    assertedRootName.value,
                    componentTypes,
                    resolveRegistry,
                    () => {
                        context.raiseError(`component type '${assertedRootName.value}' not found`, assertedRootName.range)
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
