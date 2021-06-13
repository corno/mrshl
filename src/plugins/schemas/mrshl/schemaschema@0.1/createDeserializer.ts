/* eslint
    quote-props: "off",

*/
import * as p from "pareto"
import * as astncore from "astn-core"
import * as def from "../../../../interfaces/typedParserDefinitions"
import {
    createDictionary,
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

type AnnotatedString<TokenAnnotation> = {
    value: string
    annotation: TokenAnnotation
}

function createExpectedNodeHandler<TokenAnnotation, NonTokenAnnotation>(
    context: astncore.IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    raiseValidationError: (message: string, annotation: TokenAnnotation) => void,
    componentTypes: def.IReadonlyDictionary<t.ComponentType>,
    callback: (node: t.Node) => void,
    resolveRegistry: ResolveRegistry,
): astncore.ExpectedProperty<TokenAnnotation, NonTokenAnnotation> {

    function wrap(handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>): astncore.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            exists: handler,
            missing: () => {
                //
            },
        }
    }

    return {
        onExists: () => {
            const properties = createDictionary<t.Property>({})
            return wrap(context.expectVerboseType({
                properties: {
                    "properties": {
                        onExists: () => wrap(context.expectDictionary({
                            onProperty: propertyData => {
                                let targetPropertyType: t.PropertyType | null = null
                                return wrap(context.expectVerboseType({
                                    properties: {
                                        "type": {
                                            onExists: () => wrap(context.expectTaggedUnion({
                                                options: {
                                                    "collection": () => {
                                                        let targetCollectionType: t.CollectionType | null = null
                                                        let targetNode: t.Node | null = null

                                                        return wrap(context.expectVerboseType({
                                                            properties: {
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
                                                                    onExists: () => wrap(context.expectTaggedUnion({
                                                                        options: {
                                                                            "dictionary": () => {
                                                                                let targetKeyProperty: AnnotatedString<TokenAnnotation> | null = null
                                                                                return wrap(context.expectVerboseType({
                                                                                    properties: {
                                                                                        "key property": {
                                                                                            onExists: () => wrap(context.expectQuotedString({
                                                                                                warningOnly: true,
                                                                                                callback: $ => {
                                                                                                    targetKeyProperty = {
                                                                                                        value: $.value,
                                                                                                        annotation: $.annotation,
                                                                                                    }
                                                                                                    return p.value(false)
                                                                                                },
                                                                                            })),
                                                                                            onNotExists: $ => {
                                                                                                targetKeyProperty = {
                                                                                                    value: "name",
                                                                                                    annotation: $.beginAnnotation,
                                                                                                }
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                    onEnd: () => {
                                                                                        const assertedTargetNode = assertNotNull(targetNode)

                                                                                        const assertedTargetKeyProperty = assertNotNull(targetKeyProperty)
                                                                                        targetCollectionType = ["dictionary", {
                                                                                            "key propertyx": createReference(
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

                                                                                    },
                                                                                }))
                                                                            },
                                                                            "list": () => {
                                                                                targetCollectionType = ["list", {
                                                                                }]
                                                                                return wrap(context.expectVerboseType({}))
                                                                            },
                                                                        },
                                                                    })),
                                                                    onNotExists: () => {
                                                                        targetCollectionType = ["list", {}]
                                                                    },
                                                                },
                                                            },
                                                            onEnd: () => {
                                                                const assertedTargetNode = assertNotNull(targetNode)
                                                                const asserted = assertNotNull(targetCollectionType)
                                                                targetPropertyType = ["collection", {
                                                                    "type": asserted,
                                                                    "node": assertedTargetNode,
                                                                }]
                                                            },
                                                        }))
                                                    },
                                                    "component": () => {
                                                        let targetComponentTypeName: AnnotatedString<TokenAnnotation> | null = null
                                                        return wrap(context.expectVerboseType({
                                                            properties: {
                                                                "type": {
                                                                    onExists: () => wrap(context.expectQuotedString({
                                                                        warningOnly: true,
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
                                                            onEnd: () => {
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
                                                        const states = createDictionary<t.State>({})
                                                        let targetDefaultState: null | AnnotatedString<TokenAnnotation> = null
                                                        return wrap(context.expectVerboseType({
                                                            properties: {
                                                                "states": {
                                                                    onExists: () => wrap(context.expectDictionary({
                                                                        onProperty: stateData => {
                                                                            let targetNode: t.Node | null = null
                                                                            return wrap(context.expectVerboseType({
                                                                                properties: {
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
                                                                                onEnd: () => {
                                                                                    const asserted = assertNotNull(targetNode)
                                                                                    states.add(stateData.data.keyString.value, {
                                                                                        node: asserted,
                                                                                    })
                                                                                },
                                                                            }))
                                                                        },
                                                                    })),
                                                                    onNotExists: () => {
                                                                        //nothing to do, states dictionary already initialized
                                                                    },
                                                                },
                                                                "default state": {
                                                                    onExists: () => wrap(context.expectQuotedString({
                                                                        warningOnly: true,
                                                                        callback: $ => {
                                                                            targetDefaultState = {
                                                                                value: $.value,
                                                                                annotation: $.annotation,
                                                                            }
                                                                            return p.value(false)
                                                                        },
                                                                    })),
                                                                    onNotExists: data => {
                                                                        targetDefaultState = {
                                                                            value: "yes",
                                                                            annotation: data.beginAnnotation,
                                                                        }
                                                                    },
                                                                },
                                                            },
                                                            onEnd: () => {
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
                                                        }))
                                                    },
                                                    "value": () => {
                                                        let targetValueType: t.ValueType | null = null
                                                        let defaultValue: string | null = null
                                                        return wrap(context.expectVerboseType({
                                                            properties: {
                                                                "type": {
                                                                    onExists: () => wrap(context.expectTaggedUnion({
                                                                        options: {
                                                                            "number": () => {
                                                                                targetValueType = ["number", {}]
                                                                                return wrap(context.expectVerboseType({}))
                                                                            },
                                                                            "text": () => {
                                                                                targetValueType = ["string", {}]
                                                                                return wrap(context.expectVerboseType({}))
                                                                            },
                                                                        },
                                                                    })),
                                                                    onNotExists: () => {
                                                                        targetValueType = ["string", {}]
                                                                    },
                                                                },
                                                                "default value": {
                                                                    onExists: () => wrap(context.expectQuotedString({
                                                                        warningOnly: true,
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
                                                            onEnd: () => {
                                                                const assertedTargetValueType = assertNotNull(targetValueType)
                                                                const assertedDefaultValue = assertNotNull(defaultValue)
                                                                targetPropertyType = ["value", {
                                                                    "default value": assertedDefaultValue,
                                                                    "type": assertedTargetValueType,
                                                                }]
                                                            },
                                                        }))
                                                    },
                                                },
                                            })),
                                            onNotExists: () => {
                                                targetPropertyType = ["value", {
                                                    "default value": "",
                                                    "type": ["string", {}],
                                                }]
                                            },
                                        },
                                    },
                                    onEnd: () => {
                                        const asserted = assertNotNull(targetPropertyType)
                                        properties.add(propertyData.data.keyString.value, {
                                            type: asserted,
                                        })
                                    },
                                }))
                            },
                        })),
                        onNotExists: () => {
                            //nothing to do, properties dictionary already created
                        },
                    },
                },
                onEnd: () => {
                    callback({ properties: properties })
                },
            }))
        },
        onNotExists: () => {
            callback({
                properties: createDictionary<t.Property>({}),
            })
        },
    }
}

export function createDeserializer<TokenAnnotation, NonTokenAnnotation>(
    onExpectError: (error: astncore.ExpectError, annotation: TokenAnnotation) => void,
    onValidationError: (message: string, annotation: TokenAnnotation) => void,
    callback: (metaData: null | t.Schema) => void
): astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
    const componentTypes = createDictionary<t.ComponentType>({})
    let rootName: AnnotatedString<TokenAnnotation> | null = null

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

    function wrap(handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>): astncore.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            exists: handler,
            missing: () => {
                //
            },
        }
    }
    return context.expectVerboseType({
        properties: {
            "component types": {
                onExists: _propertyData => wrap(context.expectDictionary({
                    onBegin: () => {
                        //
                    },
                    onProperty: propertyData => {
                        let targetNode: t.Node | null = null
                        return wrap(context.expectVerboseType({
                            properties: {
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
                            onEnd: () => {
                                const asserted = assertNotNull(targetNode)
                                componentTypes.add(propertyData.data.keyString.value, {
                                    node: asserted,
                                })
                            },
                        }))
                    },
                })),
                onNotExists: (): void => {
                    //nothing to do, component types already initialized
                },
            },
            "root type": {
                onExists: _propertyData => wrap(context.expectQuotedString({
                    warningOnly: true,
                    callback: $ => {
                        rootName = {
                            value: $.value,
                            annotation: $.annotation,
                        }
                        return p.value(false)
                    },
                })),
                onNotExists: data => {
                    rootName = {
                        value: "root",
                        annotation: data.beginAnnotation,
                    }
                },
            },
        },
        onEnd: () => {
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
        },
    })
}
