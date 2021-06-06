/* eslint
    quote-props: "off",

*/
import * as p from "pareto"
import * as astncore from "astn-core"
import * as streamVal from "../../../../interfaces/streamingValidationAPI"
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

type AnnotatedString<TokenAnnotation> = {
    value: string
    annotation: TokenAnnotation
}

function createNodeHandler<TokenAnnotation, NonTokenAnnotation>(
    context: astncore.IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    raiseValidationError: (message: string, annotation: TokenAnnotation) => void,
    componentTypes: streamVal.IReadonlyDictionary<streamVal.ComponentTypeDefinition>,
    callback: (node: streamVal.NodeDefinition) => void,
    resolveRegistry: ResolveRegistry
): astncore.ExpectedProperty<TokenAnnotation, NonTokenAnnotation> {

    function wrap(handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>) {
        return context.expectValue({
            handler: handler,
        })
    }
    return {
        onExists: () => {

            const properties = new g.Dictionary<streamVal.PropertyDefinition>({})
            return wrap(context.expectType({
                properties: {
                    "properties": {
                        onExists: () => wrap(context.expectDictionary({
                            onProperty: propertyData => {
                                let targetPropertyType: streamVal.PropertyTypeDefinition | null = null
                                return wrap(context.expectType({
                                    properties: {
                                        "type": {
                                            onExists: () => wrap(
                                                context.expectTaggedUnion({
                                                    options: {
                                                        "collection": () => {
                                                            let targetCollectionType: streamVal.CollectionTypeDefinition | null = null
                                                            return wrap(context.expectType({
                                                                properties: {
                                                                    "type": {
                                                                        onExists: () => wrap(context.expectTaggedUnion({
                                                                            options: {
                                                                                "dictionary": () => {
                                                                                    let targetNode: streamVal.NodeDefinition | null = null
                                                                                    let keyPropertyName: AnnotatedString<TokenAnnotation> | null = null
                                                                                    return wrap(context.expectType({
                                                                                        properties: {
                                                                                            "node": createNodeHandler(
                                                                                                context,
                                                                                                raiseValidationError,
                                                                                                componentTypes,
                                                                                                node => targetNode = node,
                                                                                                resolveRegistry,
                                                                                            ),
                                                                                            "key property": {
                                                                                                onExists: () => wrap(
                                                                                                    context.expectQuotedString({
                                                                                                        callback: $ => {
                                                                                                            keyPropertyName = {
                                                                                                                value: $.value,
                                                                                                                annotation: $.annotation,
                                                                                                            }
                                                                                                            return p.value(false)
                                                                                                        },
                                                                                                    })
                                                                                                ),
                                                                                                onNotExists: data => {
                                                                                                    keyPropertyName = {
                                                                                                        value: "name",
                                                                                                        annotation: data.beginAnnotation,
                                                                                                    }

                                                                                                },
                                                                                            },
                                                                                        },
                                                                                        onTypeEnd: () => {

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
                                                                                        },
                                                                                    }))
                                                                                },
                                                                                "list": () => {
                                                                                    let targetNode: streamVal.NodeDefinition | null = null
                                                                                    return wrap(context.expectType({
                                                                                        properties: {
                                                                                            "node": createNodeHandler(
                                                                                                context,
                                                                                                raiseValidationError,
                                                                                                componentTypes,
                                                                                                node => targetNode = node,
                                                                                                resolveRegistry
                                                                                            ),
                                                                                        },
                                                                                        onTypeEnd: () => {
                                                                                            const asserted = assertNotNull(targetNode)

                                                                                            targetCollectionType = ["list", {
                                                                                                "node": asserted,
                                                                                            }]
                                                                                        },
                                                                                    }))
                                                                                },
                                                                            },
                                                                        })),
                                                                        onNotExists: () => {
                                                                            targetCollectionType = ["list", {
                                                                                "node": {
                                                                                    properties: new g.Dictionary({}),
                                                                                },
                                                                            }]
                                                                        },
                                                                    },
                                                                },
                                                                onTypeEnd: () => {
                                                                    const asserted = assertNotNull(targetCollectionType)
                                                                    targetPropertyType = ["collection", {
                                                                        "type": asserted,
                                                                    }]
                                                                },
                                                            }))

                                                        },
                                                        "component": () => {
                                                            let targetComponentTypeName: AnnotatedString<TokenAnnotation> | null = null
                                                            return wrap(context.expectType({
                                                                properties: {
                                                                    "type": {
                                                                        onExists: () => wrap(context.expectQuotedString({
                                                                            callback: $ => {
                                                                                targetComponentTypeName = {
                                                                                    value: $.value,
                                                                                    annotation: $.annotation,
                                                                                }
                                                                                return p.value(false)

                                                                            },
                                                                        })),
                                                                        onNotExists: data => {
                                                                            targetComponentTypeName = {
                                                                                value: "",
                                                                                annotation: data.beginAnnotation,
                                                                            }
                                                                        },
                                                                    },
                                                                },
                                                                onTypeEnd: () => {
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
                                                            }))
                                                        },
                                                        "state group": () => {
                                                            const states = new g.Dictionary<streamVal.StateDefinition>({})
                                                            let defaultStateName: null | AnnotatedString<TokenAnnotation> = null
                                                            return wrap(context.expectType({
                                                                properties: {
                                                                    "states": {
                                                                        onExists: () => wrap(context.expectDictionary({
                                                                            onProperty: stateData => {
                                                                                let targetNode: streamVal.NodeDefinition | null = null
                                                                                return wrap(context.expectType({
                                                                                    properties: {
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
                                                                                    onTypeEnd: () => {
                                                                                        const asserted = assertNotNull(targetNode)
                                                                                        states.add(stateData.data.key, {
                                                                                            node: asserted,
                                                                                        })
                                                                                    },
                                                                                }))
                                                                            },
                                                                        })),
                                                                        onNotExists: () => {
                                                                            //nothing to do, states already initialized
                                                                        },
                                                                    },
                                                                    "default state": {
                                                                        onExists: () => wrap(context.expectQuotedString({
                                                                            callback: $ => {
                                                                                defaultStateName = {
                                                                                    value: $.value,
                                                                                    annotation: $.annotation,
                                                                                }
                                                                                return p.value(false)
                                                                            },
                                                                        })),
                                                                        onNotExists: data => {
                                                                            defaultStateName = {
                                                                                value: "yes",
                                                                                annotation: data.beginAnnotation,
                                                                            }
                                                                        },
                                                                    },
                                                                },
                                                                onTypeEnd: () => {

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
                                                            }))
                                                        },
                                                        "value": () => {
                                                            let quoted: null | boolean = null
                                                            let defaultValue: null | string = null
                                                            return context.expectValue({
                                                                handler: context.expectType({
                                                                    properties: {
                                                                        "quoted": {
                                                                            onExists: () => wrap(context.expectBoolean({
                                                                                callback: $ => {
                                                                                    quoted = $.value
                                                                                    return p.value(false)

                                                                                },
                                                                            })),
                                                                            onNotExists: () => {
                                                                                quoted = true
                                                                            },
                                                                        },
                                                                        "default value": {
                                                                            onExists: () => wrap(context.expectQuotedString({
                                                                                callback: $ => {
                                                                                    defaultValue = $.value
                                                                                    return p.value(false)

                                                                                },
                                                                            })),
                                                                            onNotExists: () => {
                                                                                defaultValue = ""
                                                                            },
                                                                        },
                                                                    },
                                                                    onTypeEnd: () => {
                                                                        const assertedQuoted = assertNotNull(quoted)
                                                                        const assertedDefaultValue = assertNotNull(defaultValue)
                                                                        targetPropertyType = ["value", {
                                                                            "quoted": assertedQuoted,
                                                                            "default value": assertedDefaultValue,
                                                                        }]
                                                                    },
                                                                }),
                                                                onMissing: () => {
                                                                    targetPropertyType = ["value", {
                                                                        "default value": "",
                                                                        "quoted": true,
                                                                    }]
                                                                },
                                                            })
                                                        },
                                                    },
                                                })
                                            ),
                                            onNotExists: () => {
                                                targetPropertyType = ["value", {
                                                    "default value": "",
                                                    "quoted": true,
                                                }]
                                            },
                                        },
                                    },
                                    onTypeEnd: () => {
                                        //HERE BE DRAGONS
                                        const asserted = assertNotNull(targetPropertyType)
                                        properties.add(propertyData.data.key, {
                                            type: asserted,
                                        })
                                    },
                                }))
                            },
                        }),
                        ),
                        onNotExists: () => {
                            //nothing to do, properties dictionary already initialized
                        },
                    },
                },
                onTypeEnd: () => {
                    callback({ properties: properties })
                },
            }))
        },
        onNotExists: () => {
            callback({
                properties: new g.Dictionary({}),
            })
        },
    }
}


export function createDeserializer<TokenAnnotation, NonTokenAnnotation>(
    onExpectError: (error: astncore.ExpectError, annotation: TokenAnnotation) => void,
    onValidationError: (message: string, annotation: TokenAnnotation) => void,
    callback: (metaData: streamVal.Schema | null) => void
): astncore.OnObject<TokenAnnotation, NonTokenAnnotation> {
    const componentTypes = new g.Dictionary<streamVal.ComponentTypeDefinition>({})
    let rootName: string | null = null
    let rootNameAnnotation: TokenAnnotation | null = null

    const context = astncore.createExpectContext<TokenAnnotation, NonTokenAnnotation>(
        $ => {
            onExpectError($.issue, $.annotation)
        },
        _warningMessage => {
            //ignore
        },
        () => astncore.createDummyValueHandler(),
        () => astncore.createDummyValueHandler(),
        astncore.Severity.warning,
        astncore.OnDuplicateEntry.ignore,
        astncore.createSerializedString,
    )
    const resolveRegistry = new ResolveRegistry()

    function wrap(handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>) {
        return context.expectValue({
            handler: handler,
        })
    }
    return context.expectType({
        properties: {
            "component types": {
                onExists: (): astncore.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> => wrap(context.expectDictionary({
                    onProperty: propertyData => {
                        let targetNode: streamVal.NodeDefinition | null = null
                        return wrap(context.expectType({
                            properties: {
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
                            onTypeEnd: () => {
                                const asserted = assertNotNull(targetNode)
                                componentTypes.add(propertyData.data.key, {
                                    node: asserted,
                                })
                            },
                        }))
                    },
                })),
                onNotExists: (): void => {
                    //noting to do, componentTypes dictionary already initialized
                },
            },
            "root type": {
                onExists: () => wrap(context.expectQuotedString({
                    callback: $ => {
                        rootName = $.value
                        rootNameAnnotation = $.annotation
                        return p.value(false)
                    },
                })),
                onNotExists: data => {
                    rootName = "root"
                    rootNameAnnotation = data.beginAnnotation
                },
            },
        },
        onTypeEnd: () => {
            let schema: streamVal.Schema | null = null
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
        },
    }).object
}
