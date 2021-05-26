/* eslint
    quote-props: "off",

*/
import * as p from "pareto"
import * as astn from "astn"
import * as gapi from "../../../API/generics"
import * as t from "../../../API/types"
import {
    createReference,
    ResolveRegistry,
} from "./Reference"
import * as g from "./Dictionary"

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

type AnnotatedString<Annotation> = {
    value: string
    annotation: Annotation
}

function createNodeHandler<Annotation>(
    context: astn.ExpectContext<Annotation>,
    raiseValidationError: (message: string, annotation: Annotation) => void,
    componentTypes: gapi.IReadonlyDictionary<t.ComponentType>,
    callback: (node: t.Node) => void,
    resolveRegistry: ResolveRegistry
): astn.ExpectedProperty<Annotation> {
    return {
        onExists: () => {

            const properties = new g.Dictionary<t.Property>({})
            return context.expectValue(context.expectType(
                {
                    "properties": {
                        onExists: () => context.expectValue(context.expectDictionary(
                            _beginRange => {
                                //registerCodeCompletionGenerators(endRange, "properties end")
                            },
                            propertyData => {
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
                                                                                    let targetNode: t.Node | null = null
                                                                                    let keyPropertyName: AnnotatedString<Annotation> | null = null
                                                                                    return context.expectValue(context.expectType(
                                                                                        {
                                                                                            "node": createNodeHandler(
                                                                                                context,
                                                                                                raiseValidationError,
                                                                                                componentTypes,
                                                                                                node => targetNode = node,
                                                                                                resolveRegistry,
                                                                                            ),
                                                                                            "key property": {
                                                                                                onExists: () => context.expectValue(
                                                                                                    context.expectSimpleValue(data => {
                                                                                                        keyPropertyName = {
                                                                                                            value: data.value,
                                                                                                            annotation: data.annotation,
                                                                                                        }
                                                                                                        return p.value(false)
                                                                                                    })
                                                                                                ),
                                                                                                onNotExists: data => {
                                                                                                    keyPropertyName = {
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
                                                                                            const assertedKeyPropertyName = assertNotNull(keyPropertyName)

                                                                                            targetCollectionType = ["dictionary", {
                                                                                                "node": assertedTargetNode,
                                                                                                "key property": createReference(
                                                                                                    assertedKeyPropertyName.value,
                                                                                                    assertedTargetNode.properties,
                                                                                                    resolveRegistry,
                                                                                                    () => {
                                                                                                        raiseValidationError(
                                                                                                            `property '${assertedKeyPropertyName.value}' not found`,
                                                                                                            assertedKeyPropertyName.annotation,
                                                                                                        )
                                                                                                    },
                                                                                                ),
                                                                                            }]
                                                                                        }
                                                                                    )
                                                                                    )
                                                                                },
                                                                                "list": () => {
                                                                                    let targetNode: t.Node | null = null
                                                                                    return context.expectValue(context.expectType(
                                                                                        {
                                                                                            "node": createNodeHandler(
                                                                                                context,
                                                                                                raiseValidationError,
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

                                                                                            targetCollectionType = ["list", {
                                                                                                "node": asserted,
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
                                                                                "node": {
                                                                                    properties: new g.Dictionary({}),
                                                                                },
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
                                                            const states = new g.Dictionary<t.State>({})
                                                            let defaultStateName: null | AnnotatedString<Annotation> = null
                                                            return context.expectValue(context.expectType(
                                                                {
                                                                    "states": {
                                                                        onExists: () => context.expectValue(context.expectDictionary(
                                                                            () => {
                                                                                //registerCodeCompletionGenerators(endRange, "properties end")
                                                                            },
                                                                            stateData => {
                                                                                let targetNode: t.Node | null = null
                                                                                return context.expectValue(context.expectType(
                                                                                    {
                                                                                        "node": createNodeHandler(
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
                                                                            //nothing to do, states already initialized
                                                                        },
                                                                    },
                                                                    "default state": {
                                                                        onExists: () => context.expectValue(context.expectSimpleValue(data => {
                                                                            defaultStateName = {
                                                                                value: data.value,
                                                                                annotation: data.annotation,
                                                                            }
                                                                            return p.value(false)
                                                                        })),
                                                                        onNotExists: data => {
                                                                            defaultStateName = {
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

                                                                    const assertedDefaultStateName = assertNotNull(defaultStateName)
                                                                    targetPropertyType = ["state group", {
                                                                        "states": states,

                                                                        "default state": createReference(
                                                                            assertedDefaultStateName.value,
                                                                            states,
                                                                            resolveRegistry,
                                                                            () => {
                                                                                raiseValidationError(
                                                                                    `state '${assertedDefaultStateName.value}' not found`,
                                                                                    assertedDefaultStateName.annotation,
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
                                                                                return p.value(false)

                                                                            })),
                                                                            onNotExists: () => {
                                                                                quoted = true
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
                                        properties.add(propertyData.key, {
                                            type: asserted,
                                        })
                                    }
                                )
                                )
                            },
                            _endRange => {
                                //registerCodeCompletionGenerators(endRange, "properties end")
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


export function createDeserializer<Annotation>(
    onExpectError: (error: astn.ExpectError, annotation: Annotation) => void,
    onValidationError: (message: string, annotation: Annotation) => void,
    callback: (metaData: t.Schema | null) => void
): astn.OnObject<Annotation> {
    const componentTypes = new g.Dictionary<t.ComponentType>({})
    let rootName: string | null = null
    let rootNameAnnotation: Annotation | null = null

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
                onExists: (): astn.RequiredValueHandler<Annotation> => context.expectValue(context.expectDictionary(
                    () => {
                        //registerCodeCompletionGenerators(endRange, "properties end")
                    },
                    propertyData => {
                        let targetNode: t.Node | null = null
                        return context.expectValue(context.expectType(
                            {
                                "node": createNodeHandler(
                                    context,
                                    onValidationError,
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
                                componentTypes.add(propertyData.key, {
                                    node: asserted,
                                })
                            },
                        ))
                    },
                    _endRange => {
                        //registerCodeCompletionGenerators(endRange, "component types end")
                    },
                )),
                onNotExists: (): void => {
                    //noting to do, componentTypes dictionary already initialized
                },
            },
            "root type": {
                onExists: () => context.expectValue(context.expectSimpleValue(data => {
                    rootName = data.value
                    rootNameAnnotation = data.annotation
                    return p.value(false)

                })),
                onNotExists: data => {
                    rootName = "root"
                    rootNameAnnotation = data.annotation
                },
            },
        },
        () => {
            //
        },
        () => {
            let schema: t.Schema | null = null
            const assertedRootName = assertNotNull(rootName)
            const assertedRange = assertNotNull(rootNameAnnotation)
            schema = {
                "component types": componentTypes,
                "root type": createReference(
                    assertedRootName,
                    componentTypes,
                    resolveRegistry,
                    () => {
                        onValidationError(`component type '${assertedRootName}' not found`, assertedRange)
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
