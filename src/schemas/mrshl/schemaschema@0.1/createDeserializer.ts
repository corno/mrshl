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

type AnnotatedString<Annotation> = {
    value: string
    annotation: Annotation
}

function createExpectedNodeHandler<Annotation>(
    context: astn.ExpectContext<Annotation>,
    raiseValidationError: (message: string, annotation: Annotation) => void,
    componentTypes: gapi.IReadonlyDictionary<t.ComponentType>,
    callback: (node: t.Node) => void,
    resolveRegistry: ResolveRegistry,
): astn.ExpectedProperty<Annotation> {
    return {
        onExists: () => {
            const properties = new Dictionary<t.Property>({})
            return context.expectValue(context.expectType(
                {
                    "properties": {
                        onExists: () => context.expectValue(context.expectDictionary(
                            () => {
                                //
                            },
                            propertyData => {
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
                                                                    raiseValidationError,
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
                                                                                let targetKeyProperty: AnnotatedString<Annotation> | null = null
                                                                                return context.expectValue(context.expectType(
                                                                                    {
                                                                                        "key property": {
                                                                                            onExists: () => context.expectValue(context.expectSimpleValue(data => {
                                                                                                targetKeyProperty = {
                                                                                                    value: data.value,
                                                                                                    annotation: data.annotation,
                                                                                                }
                                                                                                return p.value(false)
                                                                                            })),
                                                                                            onNotExists: data => {
                                                                                                targetKeyProperty = {
                                                                                                    value: "name",
                                                                                                    annotation: data.annotation,
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
                                                                                                        assertedTargetKeyProperty.annotation,
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
                                                        let targetComponentTypeName: AnnotatedString<Annotation> | null = null
                                                        return context.expectValue(context.expectType(
                                                            {
                                                                "type": {
                                                                    onExists: () => context.expectValue(context.expectSimpleValue(data => {
                                                                        targetComponentTypeName = {
                                                                            value: data.value,
                                                                            annotation: data.annotation,
                                                                        }
                                                                        return p.value(false)
                                                                    })),
                                                                    onNotExists: data => {
                                                                        targetComponentTypeName = {
                                                                            value: "",
                                                                            annotation: data.annotation,
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
                                                                                assertedTargetComponentTypeName.annotation,
                                                                            )
                                                                        },
                                                                    ),
                                                                }]
                                                            },
                                                        ))
                                                    },
                                                    "state group": () => {
                                                        const states = new Dictionary<t.State>({})
                                                        let targetDefaultState: null | AnnotatedString<Annotation> = null
                                                        return context.expectValue(context.expectType(
                                                            {
                                                                "states": {
                                                                    onExists: () => context.expectValue(context.expectDictionary(
                                                                        () => {
                                                                            //
                                                                        },
                                                                        stateData => {
                                                                            let targetNode: t.Node | null = null
                                                                            return context.expectValue(context.expectType(
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
                                                                    onExists: () => context.expectValue(context.expectSimpleValue(data => {
                                                                        targetDefaultState = {
                                                                            value: data.value,
                                                                            annotation: data.annotation,
                                                                        }
                                                                        return p.value(false)
                                                                    })),
                                                                    onNotExists: data => {
                                                                        targetDefaultState = {
                                                                            value: "yes",
                                                                            annotation: data.annotation,
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
                                                                                assertedTargetDefaultState.annotation,
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
                                                                    onExists: () => context.expectValue(context.expectSimpleValue(data => {
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

export function createDeserializer<Annotation>(
    onExpectError: (error: astn.ExpectError, annotation: Annotation) => void,
    onValidationError: (message: string, annotation: Annotation) => void,
    callback: (metaData: null | t.Schema) => void
): astn.OnObject<Annotation> {
    const componentTypes = new Dictionary<t.ComponentType>({})
    let rootName: AnnotatedString<Annotation> | null = null

    const context = new astn.ExpectContext<Annotation>(
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
                onExists: _propertyData => context.expectValue(context.expectDictionary(
                    () => {
                        //
                    },
                    propertyData => {
                        let targetNode: t.Node | null = null
                        return context.expectValue(context.expectType(
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
                onExists: _propertyData => context.expectValue(context.expectSimpleValue(data => {
                    rootName = {
                        value: data.value,
                        annotation: data.annotation,
                    }
                    return p.value(false)

                })),
                onNotExists: data => {
                    rootName = {
                        value: "root",
                        annotation: data.annotation,
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
                        onValidationError(`component type '${assertedRootName.value}' not found`, assertedRootName.annotation)
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
