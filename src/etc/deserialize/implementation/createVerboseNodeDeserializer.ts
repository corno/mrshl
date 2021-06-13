import * as p from "pareto"
import * as astncore from "astn-core"
import * as buildAPI from "../../../interfaces/buildAPI"
import * as def from "../../../interfaces/typedParserDefinitions"
import * as sideEffectAPI from "../../../interfaces/streamingValidationAPI"
import { DiagnosticSeverity } from "../../../interfaces/DiagnosticSeverity"
import {
    OnError,
    createUnexpectedTaggedUnionHandler,
    createUnexpectedArrayHandler,
    createUnexpectedObjectHandler,
    createUnexpectedStringHandler,
    createListDeserializer,
    createDictionaryDeserializer,
    createNodeDeserializer,
    createTaggedUnionDeserializer,
    createMultilineStringDeserializer,
    createSimpleStringDeserializer,
    defaultInitializeProperty,
    wrap,
} from "./shared"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function addComments<TokenAnnotation>(_target: buildAPI.Comments, _annotation: TokenAnnotation) {
    // contextData.before.comments.forEach(c => {
    //     target.addComment(c.text, c.type === "block" ? ["block"] : ["line"])
    // })
    // if (contextData.lineCommentAfter !== null) {
    //     target.addComment(contextData.lineCommentAfter.text, contextData.lineCommentAfter.type === "block" ? ["block"] : ["line"])
    // }
}

export function createVerboseNodeDeserializer<TokenAnnotation, NonTokenAnnotation>(
    nodeDefinition: def.NodeDefinition,
    keyPropertyDefinition: def.PropertyDefinition | null,
    nodeBuilder: buildAPI.Node,
    keyProperty: def.PropertyDefinition | null,
    sideEffectsAPI: sideEffectAPI.NodeHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: buildAPI.Comments,
): astncore.OnObject<TokenAnnotation, NonTokenAnnotation> {
    return $n => {

        if ($n.data.type[0] !== "verbose type") {
            onError("expected a verbose type: ( )", $n.annotation, DiagnosticSeverity.warning)
        }

        addComments(targetComments, $n.annotation)

        const typeSideEffects = sideEffectsAPI.map(s => {
            return s.onVerboseTypeOpen({
                data: $n.data,
                annotation: {
                    annotation: $n.annotation,
                    nodeDefinition: nodeDefinition,
                    keyPropertyDefinition: keyPropertyDefinition,
                },
            })
        })

        const processedProperties: {
            [key: string]: {
                annotation: TokenAnnotation
                isNonDefault: boolean
            }
        } = {}
        return {
            property: $p => {
                const key = $p.data.keyString.value
                const propertyDefinition = nodeDefinition.properties.get(key)
                if (propertyDefinition === null) {
                    onError(`unknown property: '${key}'. Choose from ${nodeDefinition.properties.getKeys().map(k => `'${k}'`).join(", ")}`, $p.annotation, DiagnosticSeverity.error)
                    typeSideEffects.forEach(s => {
                        s.onUnexpectedProperty({
                            data: $p.data,
                            annotation: {
                                nodeDefinition: nodeDefinition,
                                key: key,
                                annotation: $p.annotation,
                            },
                        })
                    })
                    return p.value(astncore.createDummyRequiredValueHandler())
                } else {

                    const pp = {
                        annotation: $p.annotation,
                        isNonDefault: false,
                    }
                    processedProperties[key] = pp

                    if (propertyDefinition === keyProperty) {
                        onError("unexpected identifying property", $p.annotation, DiagnosticSeverity.error)
                        typeSideEffects.forEach(s => {
                            s.onUnexpectedProperty({
                                data: $p.data,
                                annotation: {
                                    nodeDefinition: nodeDefinition,
                                    key: key,
                                    annotation: $p.annotation,
                                },
                            })
                        })
                        return p.value(astncore.createDummyRequiredValueHandler())
                    } else {


                        function createPropertyDeserializer<TokenAnnotation, NonTokenAnnotation>(
                            propertyDefinition: def.PropertyDefinition,
                            key: string,
                            nodeBuilder: buildAPI.Node,
                            sideEffectsAPIs: sideEffectAPI.PropertyHandler<TokenAnnotation>[],
                            onError: OnError<TokenAnnotation>,
                            flagNonDefaultPropertiesFound: () => void,
                        ): astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation> {

                            switch (propertyDefinition.type[0]) {
                                case "collection": {
                                    const $ = propertyDefinition.type[1]

                                    switch ($.type[0]) {
                                        case "dictionary": {
                                            const $$ = $.type[1]
                                            addComments(nodeBuilder.getDictionary(key).comments, $p.annotation)

                                            return {
                                                array: $ => {
                                                    return createUnexpectedArrayHandler(`expected a dictionary`, $.annotation, onError)
                                                },
                                                object: createDictionaryDeserializer(
                                                    $$,
                                                    key,
                                                    nodeBuilder,
                                                    sideEffectsAPIs,
                                                    onError,
                                                    flagNonDefaultPropertiesFound,
                                                ),
                                                taggedUnion: $ => {
                                                    return createUnexpectedTaggedUnionHandler(`expected a dictionary`, $.annotation, onError)
                                                },
                                                simpleString: $ => {
                                                    return createUnexpectedStringHandler(`expected a dictionary`, $.annotation, onError)
                                                },
                                                multilineString: $ => {
                                                    return createUnexpectedStringHandler(`expected a dictionary`, $.annotation, onError)
                                                },
                                            }

                                        }
                                        case "list": {
                                            const $$ = $.type[1]
                                            addComments(nodeBuilder.getList(key).comments, $p.annotation)

                                            return {
                                                array: createListDeserializer(
                                                    $$,
                                                    key,
                                                    nodeBuilder,
                                                    sideEffectsAPIs,
                                                    onError,
                                                    flagNonDefaultPropertiesFound,
                                                ),
                                                object: $ => {
                                                    return createUnexpectedObjectHandler(`expected a list`, $.annotation, onError)
                                                },
                                                taggedUnion: $ => {
                                                    return createUnexpectedTaggedUnionHandler(`expected a list`, $.annotation, onError)
                                                },
                                                simpleString: $ => {
                                                    return createUnexpectedStringHandler(`expected a list`, $.annotation, onError)
                                                },
                                                multilineString: $ => {
                                                    return createUnexpectedStringHandler(`expected a list`, $.annotation, onError)
                                                },
                                            }
                                        }
                                        default:
                                            return assertUnreachable($.type[0])
                                    }
                                }
                                case "component": {
                                    const $ = propertyDefinition.type[1]
                                    const componentBuilder = nodeBuilder.getComponent(key)
                                    addComments(nodeBuilder.getComponent(key).comments, $p.annotation)

                                    return createNodeDeserializer(
                                        $.type.get().node,
                                        null,
                                        componentBuilder.node,
                                        null,
                                        sideEffectsAPIs.map(s => {
                                            return s.onComponent()
                                        }),
                                        onError,
                                        flagNonDefaultPropertiesFound,
                                        componentBuilder.comments,
                                    )
                                }
                                case "tagged union": {
                                    const $ = propertyDefinition.type[1]
                                    addComments(nodeBuilder.getTaggedUnion(key).comments, $p.annotation)

                                    return {
                                        array: $ => {
                                            return createUnexpectedArrayHandler(`expected a tagged union`, $.annotation, onError)
                                        },
                                        object: $ => {
                                            return createUnexpectedObjectHandler(`expected a tagged union`, $.annotation, onError)
                                        },
                                        taggedUnion: createTaggedUnionDeserializer(
                                            $,
                                            key,
                                            nodeBuilder,
                                            sideEffectsAPIs,
                                            onError,
                                            flagNonDefaultPropertiesFound,
                                        ),
                                        simpleString: $ => {
                                            return createUnexpectedStringHandler(`expected a tagged union`, $.annotation, onError)
                                        },
                                        multilineString: $ => {
                                            return createUnexpectedStringHandler(`expected a tagged union`, $.annotation, onError)
                                        },
                                    }
                                }
                                case "string": {
                                    const $ = propertyDefinition.type[1]
                                    addComments(nodeBuilder.getValue(key).comments, $p.annotation)

                                    return {
                                        array: $ => {
                                            return createUnexpectedArrayHandler(`expected a string`, $.annotation, onError)
                                        },
                                        object: $ => {
                                            return createUnexpectedObjectHandler(`expected a string`, $.annotation, onError)
                                        },
                                        taggedUnion: $ => {
                                            return createUnexpectedTaggedUnionHandler(`expected a string`, $.annotation, onError)
                                        },
                                        multilineString: createMultilineStringDeserializer(
                                            $,
                                            key,
                                            nodeBuilder,
                                            sideEffectsAPIs,
                                            onError,
                                            flagNonDefaultPropertiesFound,
                                        ),
                                        simpleString: createSimpleStringDeserializer(
                                            $,
                                            key,
                                            nodeBuilder,
                                            sideEffectsAPIs,
                                            onError,
                                            flagNonDefaultPropertiesFound,
                                        ),
                                    }
                                }
                                default:
                                    return assertUnreachable(propertyDefinition.type[0])
                            }
                        }
                        return p.value(wrap(createPropertyDeserializer(
                            propertyDefinition,
                            key,
                            nodeBuilder,
                            typeSideEffects.map(s => {
                                return s.onProperty({
                                    data: $p.data,
                                    annotation: {
                                        definition: propertyDefinition,
                                        key: key,
                                        annotation: $p.annotation,
                                    },
                                })
                            }),
                            onError,
                            () => {
                                pp.isNonDefault = true
                            },
                        )))
                    }
                }

            },
            objectEnd: $$ => {
                addComments(targetComments, $$.annotation)
                let hadNonDefaultProperties = false

                nodeDefinition.properties.forEach((propDefinition, propKey) => {
                    if (propDefinition === keyProperty) {
                        return
                    }
                    const pp = processedProperties[propKey]
                    if (pp === undefined) {
                        defaultInitializeProperty(
                            $n.annotation,
                            propDefinition,
                            propKey,
                            nodeBuilder,
                            onError,
                        )
                    } else {
                        if (!pp.isNonDefault) {
                            onError(`property '${propKey}' has default value, remove`, pp.annotation, DiagnosticSeverity.warning)
                        } else {
                            hadNonDefaultProperties = true
                        }
                    }
                })
                if (hadNonDefaultProperties) {
                    flagNonDefaultPropertiesFound()
                }
                typeSideEffects.forEach(s => {
                    s.onVerboseTypeClose({
                        annotation: {
                            annotation: $$.annotation,
                        },
                    })
                })
                return p.value(null)
            },
        }
    }
}