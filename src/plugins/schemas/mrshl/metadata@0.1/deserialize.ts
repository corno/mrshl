/* eslint
    quote-props: "off",

*/
import * as p from "pareto"
import * as astncore from "astn-core"
import * as def from "./definitions"
import * as g2 from "../../../../interfaces/typedParserDefinitions/generics"
import * as extDef from "../../../../interfaces/typedParserDefinitions"
import {
    createReference,
    ResolveRegistry,
} from "./Reference"
import * as g from "./Dictionary"
import { convertToGenericSchema } from "./createTypedParserDefinitions"

/**
 * this function is only calls back if the value is not null
 * @param value value
 * @param callback
 */

type AnnotatedString<TokenAnnotation> = {
    value: string
    annotation: TokenAnnotation
}

function createNodeHandler<TokenAnnotation, NonTokenAnnotation>(
    context: astncore.IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    raiseValidationError: (message: string, annotation: TokenAnnotation) => void,
    componentTypes: g2.IReadonlyDictionary<def.ComponentTypeDefinition>,
    callback: (node: def.NodeDefinition) => void,
    resolveRegistry: ResolveRegistry
): astncore.ExpectedProperty<TokenAnnotation, NonTokenAnnotation> {

    function assertNotNull<T>(value: T | null, valueName: string, annotation: TokenAnnotation) {
        if (value !== null) {
            return value
        }
        raiseValidationError(`missing value '${valueName}'`, annotation)
        throw new Error("missing value")
    }
    function wrap(handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>) {
        return {
            exists: handler,
            missing: () => {
                //
            },
        }
    }
    return {
        onExists: () => {

            const properties = g.createDictionary<def.PropertyDefinition>({})
            return wrap(context.expectType({
                properties: {
                    "properties": {
                        onExists: () => wrap(context.expectDictionary({
                            onProperty: propertyData => {
                                let targetPropertyType: def.PropertyTypeDefinition | null = null
                                return wrap(context.expectType({
                                    properties: {
                                        "type": {
                                            onExists: () => wrap(
                                                context.expectTaggedUnion({
                                                    options: {
                                                        "collection": () => {
                                                            let targetCollectionType: def.CollectionTypeDefinition | null = null
                                                            return wrap(context.expectType({
                                                                properties: {
                                                                    "type": {
                                                                        onExists: () => wrap(context.expectTaggedUnion({
                                                                            options: {
                                                                                "dictionary": () => {
                                                                                    let targetNode: def.NodeDefinition | null = null
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
                                                                                                        warningOnly: true,
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
                                                                                        onTypeEnd: $ => {

                                                                                            const assertedTargetNode = assertNotNull(targetNode, "node", $.annotation)
                                                                                            const assertedKeyPropertyName = assertNotNull(keyPropertyName, "key property", $.annotation)

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
                                                                                    let targetNode: def.NodeDefinition | null = null
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
                                                                                        onTypeEnd: $ => {
                                                                                            const asserted = assertNotNull(targetNode, "node", $.annotation)

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
                                                                                    properties: g.createDictionary({}),
                                                                                },
                                                                            }]
                                                                        },
                                                                    },
                                                                },
                                                                onTypeEnd: $ => {
                                                                    const asserted = assertNotNull(targetCollectionType, "type", $.annotation)
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
                                                                onTypeEnd: $ => {
                                                                    const assertedTargetComponentTypeName = assertNotNull(targetComponentTypeName, "type", $.annotation)
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
                                                            const states = g.createDictionary<def.StateDefinition>({})
                                                            let defaultStateName: null | AnnotatedString<TokenAnnotation> = null
                                                            return wrap(context.expectType({
                                                                properties: {
                                                                    "states": {
                                                                        onExists: () => wrap(context.expectDictionary({
                                                                            onProperty: stateData => {
                                                                                let targetNode: def.NodeDefinition | null = null
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
                                                                                    onTypeEnd: $ => {
                                                                                        const asserted = assertNotNull(targetNode, "node", $.annotation)
                                                                                        states.add(stateData.data.key.value, {
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
                                                                            warningOnly: true,
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
                                                                onTypeEnd: $ => {

                                                                    const assertedDefaultStateName = assertNotNull(defaultStateName, "default state", $.annotation)
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
                                                            return {
                                                                exists: context.expectType({
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
                                                                    onTypeEnd: $ => {
                                                                        const assertedQuoted = assertNotNull(quoted, "quoted", $.annotation)
                                                                        const assertedDefaultValue = assertNotNull(defaultValue, "default value", $.annotation)
                                                                        targetPropertyType = ["value", {
                                                                            "quoted": assertedQuoted,
                                                                            "default value": assertedDefaultValue,
                                                                        }]
                                                                    },
                                                                }),
                                                                missing: () => {
                                                                    targetPropertyType = ["value", {
                                                                        "default value": "",
                                                                        "quoted": true,
                                                                    }]
                                                                },
                                                            }
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
                                    onTypeEnd: $ => {
                                        //HERE BE DRAGONS
                                        const asserted = assertNotNull(targetPropertyType, "type", $.annotation)
                                        properties.add(propertyData.data.key.value, {
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
                properties: g.createDictionary({}),
            })
        },
    }
}


export function createDeserializer<TokenAnnotation, NonTokenAnnotation>(
    onExpectError: (error: astncore.ExpectError, annotation: TokenAnnotation) => void,
    onValidationError: (message: string, annotation: TokenAnnotation) => void,
    callback: (metaData: extDef.Schema | null) => void
): astncore.OnObject<TokenAnnotation, NonTokenAnnotation> {
    const componentTypes = g.createDictionary<def.ComponentTypeDefinition>({})
    let rootName: AnnotatedString<TokenAnnotation> | null = null

    const context = astncore.createExpectContext<TokenAnnotation, NonTokenAnnotation>(
        $ => {
            onExpectError($.issue, $.annotation)
        },
        _warningMessage => {
            //
        },
        () => astncore.createDummyValueHandler(),
        () => astncore.createDummyValueHandler(),
        astncore.Severity.warning,
        astncore.OnDuplicateEntry.ignore,
        astncore.createSerializedString,
    )
    const resolveRegistry = new ResolveRegistry()

    function wrap(handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>) {
        return {
            exists: handler,
            missing: () => {
                //
            },
        }
    }
    function assertNotNull<T>(value: T | null, valueName: string, annotation: TokenAnnotation) {
        if (value !== null) {
            return value
        }
        onValidationError(`missing value '${valueName}'`, annotation)
        throw new Error("missing value")
    }
    return context.expectType({
        properties: {
            "component types": {
                onExists: () => {
                    return wrap(context.expectDictionary({
                        onProperty: propertyData => {
                            let targetNode: def.NodeDefinition | null = null
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
                                onTypeEnd: $ => {
                                    const asserted = assertNotNull(targetNode, "node", $.annotation)
                                    componentTypes.add(propertyData.data.key.value, {
                                        node: asserted,
                                    })
                                },
                            }))
                        },
                    }))
                },
                onNotExists: (): void => {
                    //noting to do, componentTypes dictionary already initialized
                },
            },
            "root type": {
                onExists: () => {
                    return wrap(context.expectQuotedString({
                        warningOnly: true,
                        callback: $ => {
                            rootName = {
                                annotation: $.annotation,
                                value: $.value,
                            }
                            return p.value(false)
                        },
                    }))
                },
                onNotExists: data => {
                    rootName = {
                        annotation: data.beginAnnotation,
                        value: "root",
                    }
                },
            },
        },
        onTypeEnd: $ => {
            let schema: def.Schema | null = null
            const assertedRootName = assertNotNull(rootName, "root type", $.annotation)
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
                callback(convertToGenericSchema(schema))
            } else {
                callback(null)
            }
        },
    }).object
}
