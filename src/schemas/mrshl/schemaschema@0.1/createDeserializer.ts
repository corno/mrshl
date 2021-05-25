/* eslint
    quote-props: "off",

*/
import * as p from "pareto"
import * as astn from "astn"
import * as gapi from "../../../API/generics"
import {
    Dictionary,
} from "./Dictionary"
import {
    ResolveRegistry,
    createReference,
} from "./Reference"
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
    range: astn.Range
}

function createExpectedNodeHandler(
    context: astn.ExpectContext,
    raiseValidationError: (message: string, range: astn.Range) => void,
    componentTypes: gapi.IReadonlyDictionary<t.ComponentType>,
    callback: (node: t.Node) => void,
    resolveRegistry: ResolveRegistry,
): astn.ExpectedProperty {
    return {
        onExists: () => {
            const properties = new Dictionary<t.Property>({})
            return context.expectValue(() => context.expectType(
                {
                    "properties": {
                        onExists: () => context.expectValue(() => context.expectDictionary(
                            () => {
                                //
                            },
                            propertyData => {
                                let targetPropertyType: t.PropertyType | null = null
                                return context.expectValue(() => context.expectType(
                                    {
                                        "type": {
                                            onExists: () => context.expectValue(() => context.expectTaggedUnion(
                                                {
                                                    "collection": () => {
                                                        let targetCollectionType: t.CollectionType | null = null
                                                        let targetNode: t.Node | null = null

                                                        return context.expectValue(() => context.expectType(
                                                            {
                                                                "node": createExpectedNodeHandler(
                                                                    context,
                                                                    raiseValidationError,
                                                                    componentTypes,
                                                                    node => {
                                                                        targetNode = node
                                                                    },
                                                                    resolveRegistry,
                                                                ),
                                                                "type": {
                                                                    onExists: () => context.expectValue(() => context.expectTaggedUnion(
                                                                        {
                                                                            "dictionary": () => {
                                                                                let targetKeyProperty: StringAndRange | null = null
                                                                                return context.expectValue(() => context.expectType(
                                                                                    {
                                                                                        "key property": {
                                                                                            onExists: () => context.expectValue(() => context.expectSimpleValue((range, data) => {
                                                                                                targetKeyProperty = {
                                                                                                    value: data.value,
                                                                                                    range: range,
                                                                                                }
                                                                                                return p.value(false)
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
                                                                                            "key property": createReference(
                                                                                                assertedTargetKeyProperty.value,
                                                                                                assertedTargetNode.properties,
                                                                                                resolveRegistry,
                                                                                                () => {
                                                                                                    raiseValidationError(
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
                                                                                return context.expectValue(() => context.expectType())
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
                                                        return context.expectValue(() => context.expectType(
                                                            {
                                                                "type": {
                                                                    onExists: () => context.expectValue(() => context.expectSimpleValue((range, data) => {
                                                                        targetComponentTypeName = {
                                                                            value: data.value,
                                                                            range: range,
                                                                        }
                                                                        return p.value(false)
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
                                                                    "type": createReference(
                                                                        assertedTargetComponentTypeName.value,
                                                                        componentTypes,
                                                                        resolveRegistry,
                                                                        () => {
                                                                            raiseValidationError(
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
                                                        const states = new Dictionary<t.State>({})
                                                        let targetDefaultState: null | StringAndRange = null
                                                        return context.expectValue(() => context.expectType(
                                                            {
                                                                "states": {
                                                                    onExists: () => context.expectValue(() => context.expectDictionary(
                                                                        () => {
                                                                            //
                                                                        },
                                                                        stateData => {
                                                                            let targetNode: t.Node | null = null
                                                                            return context.expectValue(() => context.expectType(
                                                                                {
                                                                                    "node": createExpectedNodeHandler(
                                                                                        context,
                                                                                        raiseValidationError,
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
                                                                                    states.add(stateData.key, {
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
                                                                        //nothing to do, states dictionary already initialized
                                                                    },
                                                                },
                                                                "default state": {
                                                                    onExists: () => context.expectValue(() => context.expectSimpleValue((range, data) => {
                                                                        targetDefaultState = {
                                                                            value: data.value,
                                                                            range: range,
                                                                        }
                                                                        return p.value(false)
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
                                                                    "default state": createReference(
                                                                        assertedTargetDefaultState.value,
                                                                        states,
                                                                        resolveRegistry,
                                                                        () => {
                                                                            raiseValidationError(
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
                                                        return context.expectValue(() => context.expectType(
                                                            {
                                                                "type": {
                                                                    onExists: () => context.expectValue(() => context.expectTaggedUnion(
                                                                        {
                                                                            "number": () => {
                                                                                targetValueType = ["number", {}]
                                                                                return context.expectValue(() => context.expectType())
                                                                            },
                                                                            "text": () => {
                                                                                targetValueType = ["string", {}]
                                                                                return context.expectValue(() => context.expectType())
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
                                                                    onExists: () => context.expectValue(() => context.expectSimpleValue((_range, data) => {
                                                                        defaultValue = data.value
                                                                        return p.value(false)
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
                                        properties.add(propertyData.key, {
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
                properties: new Dictionary<t.Property>({}),
            })
        },
    }
}

export function createDeserializer(
    onExpectError: (error: astn.ExpectError, range: astn.Range) => void,
    onValidationError: (message: string, range: astn.Range) => void,
    callback: (metaData: null | t.Schema) => void
): astn.OnObject {
    const componentTypes = new Dictionary<t.ComponentType>({})
    let rootName: StringAndRange | null = null

    const context = new astn.ExpectContext(
        (_errorMessage, _range) => {
            onExpectError(_errorMessage, _range)
        },
        _warningMessage => {
            //ignore
        },
        () => astn.createDummyValueHandler(),
        () => astn.createDummyValueHandler(),
        astn.Severity.warning,
        astn.OnDuplicateEntry.ignore
    )
    const resolveRegistry = new ResolveRegistry()

    return context.createTypeHandler(
        {
            "component types": {
                onExists: (): astn.RequiredValueHandler => context.expectValue(() => context.expectDictionary(
                    () => {
                        //
                    },
                    propertyData => {
                        let targetNode: t.Node | null = null
                        return context.expectValue(() => context.expectType(
                            {
                                "node": createExpectedNodeHandler(
                                    context,
                                    onValidationError,
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
                                componentTypes.add(propertyData.key, {
                                    node: asserted,
                                })
                            },
                        ))
                    },
                    () => {
                        //
                    },
                )),
                onNotExists: (): void => {
                    //nothing to do, component types already initialized
                },
            },
            "root type": {
                onExists: (): astn.RequiredValueHandler => context.expectValue(() => context.expectSimpleValue((range, svData) => {
                    rootName = {
                        value: svData.value,
                        range: range,
                    }
                    return p.value(false)

                })),
                onNotExists: (range: astn.Range): void => {
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
                "root type": createReference(
                    assertedRootName.value,
                    componentTypes,
                    resolveRegistry,
                    () => {
                        onValidationError(`component type '${assertedRootName.value}' not found`, assertedRootName.range)
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
