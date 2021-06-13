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
    createTaggedUnionDeserializer,
    createMultilineStringDeserializer,
    createSimpleStringDeserializer,
    defaultInitializeProperty,
} from "./shared"
import { createVerboseNodeDeserializer } from "./createVerboseNodeDeserializer"

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

export function createShorthandNodeDeserializer<TokenAnnotation, NonTokenAnnotation>(
    nodeDefinition: def.NodeDefinition,
    keyPropertyDefinition: def.PropertyDefinition | null,
    nodeBuilderX: buildAPI.Node,
    keyProperty: def.PropertyDefinition | null,
    sideEffectsAPIsX: sideEffectAPI.NodeHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: buildAPI.Comments,
): astncore.OnArray<TokenAnnotation, NonTokenAnnotation> {
    return $3 => {
        if ($3.data.type[0] !== "shorthand type") {
            onError("array is not a shorthand type", $3.annotation, DiagnosticSeverity.error)
        }
        type ExpectedElement = {
            name: string
            propDefinition: def.PropertyDefinition
            nodeBuilder: buildAPI.Node,
            handlers: sideEffectAPI.ShorthandTypeHandler<TokenAnnotation>[]
        }

        type ExpectedElements = ExpectedElement[]

        type ExpectingNextProperty = {
            elements: ExpectedElements
            handlers: sideEffectAPI.ShorthandTypeHandler<TokenAnnotation>[]
            index: number
        }

        function createNodeParser(
            currentNodeDefinition: def.NodeDefinition,
            handlers: sideEffectAPI.NodeHandler<TokenAnnotation>[],
            nb: buildAPI.Node,
            ann: TokenAnnotation | null,
        ): ExpectingNextProperty {
            const expectedElements: ExpectedElements = []
            const shorthandTypeHandlers = handlers.map(s => {
                return s.onShorthandTypeOpen({
                    data: $3.data,
                    annotation: {
                        annotation: ann,
                        nodeDefinition: nodeDefinition,
                        keyPropertyDefinition: keyPropertyDefinition,
                    },
                })
            })
            currentNodeDefinition.properties.forEach((propDefinition, propKey) => {
                if (keyProperty === propDefinition) {
                    return
                }
                expectedElements.push({
                    name: propKey,
                    nodeBuilder: nb,
                    handlers: shorthandTypeHandlers,
                    propDefinition: propDefinition,
                })
            })
            return {
                elements: expectedElements,
                handlers: shorthandTypeHandlers,
                index: 0,
            }
        }


        const stack: ExpectingNextProperty[] = []
        let currentContext = createNodeParser(
            nodeDefinition,
            sideEffectsAPIsX,
            nodeBuilderX,
            $3.annotation,
        )

        return {
            element: () => {
                function findNextProperty(): null | ExpectedElement {
                    const ee = currentContext.elements[currentContext.index]
                    currentContext.index++
                    if (ee !== undefined) {
                        return ee
                    } else {
                        //end of array of properties
                        currentContext.handlers.forEach(h => {
                            h.onShorthandTypeClose({
                                annotation: {
                                    annotation: null,
                                },
                            })
                        })
                        const previousContext = stack.pop()
                        if (previousContext === undefined) {
                            return null
                        } else {
                            currentContext = previousContext
                            return findNextProperty()
                        }
                    }
                }
                const ee = findNextProperty()
                function handleExpectedElement(ee2: ExpectedElement | null): astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation> {

                    if (ee2 === null) {
                        const dvh = astncore.createDummyValueHandler()
                        return {
                            object: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.object(data)
                            },
                            array: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.array(data)
                            },
                            simpleString: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.simpleString(data)
                            },
                            multilineString: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.multilineString(data)
                            },
                            taggedUnion: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.taggedUnion(data)
                            },
                        }
                    } else {
                        const ee3 = ee2
                        function doComponent(
                            definition: def.ComponentDefinition,
                        ) {
                            stack.push(currentContext)
                            currentContext = createNodeParser(
                                definition.type.get().node,
                                ee3.handlers.map(h => {
                                    return h.onProperty({
                                        annotation: {
                                            //annnotation: $$.annotation,
                                            propKey: ee3.name,
                                            definition: ee3.propDefinition,
                                        },
                                    }).onComponent()
                                }),
                                ee3.nodeBuilder.getComponent(ee3.name).node,
                                null,
                            )
                            const nextProp = findNextProperty()
                            return handleExpectedElement(nextProp)
                        }
                        return {
                            object: $$ => {
                                switch (ee2.propDefinition.type[0]) {
                                    case "collection": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        switch ($$$.type[0]) {
                                            case "dictionary": {
                                                const $$$$ = $$$.type[1]
                                                return createDictionaryDeserializer(
                                                    $$$$,
                                                    ee2.name,
                                                    ee3.nodeBuilder,
                                                    ee2.handlers.map(s => {
                                                        return s.onProperty({
                                                            annotation: {
                                                                propKey: ee2.name,
                                                                definition: ee2.propDefinition,
                                                            },
                                                        })
                                                    }),
                                                    onError,
                                                    flagNonDefaultPropertiesFound,
                                                )($$)
                                            }
                                            case "list": {
                                                return createUnexpectedObjectHandler(`expected a list: '${ee2.name}'`, $$.annotation, onError)
                                            }
                                            default:
                                                return assertUnreachable($$$.type[0])
                                        }
                                    }
                                    case "component": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        switch ($$.data.type[0]) {
                                            case "dictionary": {
                                                return doComponent($$$).object($$)
                                            }
                                            case "verbose type": {
                                                const $ = ee2.propDefinition.type[1]
                                                const componentBuilder = ee3.nodeBuilder.getComponent(ee2.name)
                                                return createVerboseNodeDeserializer(
                                                    $.type.get().node,
                                                    null,
                                                    componentBuilder.node,
                                                    null,
                                                    ee2.handlers.map(s => {
                                                        return s.onProperty({
                                                            annotation: {
                                                                propKey: ee2.name,
                                                                definition: ee2.propDefinition,
                                                            },
                                                        }).onComponent()
                                                    }),
                                                    onError,
                                                    flagNonDefaultPropertiesFound,
                                                    componentBuilder.comments,
                                                )($$)
                                            }
                                            default:
                                                return assertUnreachable($$.data.type[0])
                                        }
                                    }
                                    case "string": {
                                        return createUnexpectedObjectHandler(`expected a string: '${ee2.name}'`, $$.annotation, onError)
                                    }
                                    case "tagged union": {
                                        return createUnexpectedObjectHandler(`expected a tagged union: '${ee2.name}'`, $$.annotation, onError)
                                    }
                                    default:
                                        return assertUnreachable(ee2.propDefinition.type[0])
                                }
                            },
                            array: $$ => {
                                switch (ee2.propDefinition.type[0]) {
                                    case "collection": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        switch ($$$.type[0]) {
                                            case "dictionary": {
                                                return createUnexpectedArrayHandler(`expected a dictionary: '${ee2.name}'`, $$.annotation, onError)
                                            }
                                            case "list": {
                                                const $$$$ = $$$.type[1]
                                                return createListDeserializer(
                                                    $$$$,
                                                    ee2.name,
                                                    ee3.nodeBuilder,
                                                    ee2.handlers.map(s => {
                                                        return s.onProperty({
                                                            annotation: {
                                                                propKey: ee2.name,
                                                                definition: ee2.propDefinition,
                                                            },
                                                        })
                                                    }),
                                                    onError,
                                                    flagNonDefaultPropertiesFound,
                                                )($$)
                                            }
                                            default:
                                                return assertUnreachable($$$.type[0])
                                        }
                                    }
                                    case "component": {
                                        const $$$ = ee2.propDefinition.type[1]

                                        switch ($$.data.type[0]) {
                                            case "list": {
                                                return doComponent($$$).array($$)
                                            }
                                            case "shorthand type": {
                                                const $ = ee2.propDefinition.type[1]
                                                const componentBuilder = ee3.nodeBuilder.getComponent(ee2.name)
                                                return createShorthandNodeDeserializer(
                                                    $.type.get().node,
                                                    null,
                                                    componentBuilder.node,
                                                    null,
                                                    ee2.handlers.map(s => {
                                                        return s.onProperty({
                                                            annotation: {
                                                                propKey: ee2.name,
                                                                definition: ee2.propDefinition,
                                                            },
                                                        }).onComponent()
                                                    }),
                                                    onError,
                                                    flagNonDefaultPropertiesFound,
                                                    componentBuilder.comments,
                                                )($$)
                                            }
                                            default:
                                                return assertUnreachable($$.data.type[0])
                                        }

                                    }
                                    case "string": {
                                        return createUnexpectedArrayHandler(`expected a string: '${ee2.name}'`, $$.annotation, onError)
                                    }
                                    case "tagged union": {
                                        return createUnexpectedArrayHandler(`expected a tagged union: '${ee2.name}'`, $$.annotation, onError)
                                    }
                                    default:
                                        return assertUnreachable(ee2.propDefinition.type[0])
                                }
                            },
                            taggedUnion: $1 => {
                                switch (ee2.propDefinition.type[0]) {
                                    case "collection": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        switch ($$$.type[0]) {
                                            case "dictionary": {
                                                return createUnexpectedTaggedUnionHandler(`expected a dictionary: '${ee2.name}'`, $1.annotation, onError)
                                            }
                                            case "list": {
                                                return createUnexpectedTaggedUnionHandler(`expected a list: '${ee2.name}'`, $1.annotation, onError)
                                            }
                                            default:
                                                return assertUnreachable($$$.type[0])
                                        }
                                    }
                                    case "component": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        return doComponent($$$).taggedUnion($1)
                                    }
                                    case "string": {
                                        return createUnexpectedTaggedUnionHandler(`expected a string: '${ee2.name}'`, $1.annotation, onError)
                                    }
                                    case "tagged union": {
                                        const $ = ee2.propDefinition.type[1]
                                        return createTaggedUnionDeserializer(
                                            $,
                                            ee2.name,
                                            ee3.nodeBuilder,
                                            ee2.handlers.map(s => {
                                                return s.onProperty({
                                                    annotation: {
                                                        propKey: ee2.name,
                                                        definition: ee2.propDefinition,
                                                    },
                                                })
                                            }),
                                            onError,
                                            flagNonDefaultPropertiesFound,
                                        )($1)
                                    }
                                    default:
                                        return assertUnreachable(ee2.propDefinition.type[0])
                                }
                            },
                            simpleString: $$ => {
                                switch (ee2.propDefinition.type[0]) {
                                    case "collection": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        switch ($$$.type[0]) {
                                            case "dictionary": {
                                                return createUnexpectedStringHandler(`expected a dictionary: '${ee2.name}'`, $$.annotation, onError)
                                            }
                                            case "list": {
                                                return createUnexpectedStringHandler(`expected a list: '${ee2.name}'`, $$.annotation, onError)
                                            }
                                            default:
                                                return assertUnreachable($$$.type[0])
                                        }
                                    }
                                    case "component": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        return doComponent($$$).simpleString($$)
                                    }
                                    case "string": {
                                        const $ = ee2.propDefinition.type[1]
                                        return createSimpleStringDeserializer(
                                            $,
                                            ee2.name,
                                            ee3.nodeBuilder,
                                            ee2.handlers.map(s => {
                                                return s.onProperty({
                                                    annotation: {
                                                        propKey: ee2.name,
                                                        definition: ee2.propDefinition,
                                                    },
                                                })
                                            }),
                                            onError,
                                            flagNonDefaultPropertiesFound,
                                        )($$)
                                    }
                                    case "tagged union": {
                                        const $$$ = ee2.propDefinition.type[1]


                                        const optionName = $$.data.value
                                        const option = $$$.options.get(optionName)
                                        const stateGroup = ee3.nodeBuilder.getTaggedUnion(ee3.name)
                                        addComments(stateGroup.comments, $$.annotation)

                                        if (option === null) {
                                            onError(`unknown option: '${optionName}', choose from: ${$$$.options.getKeys().map(k => `'${k}'`).join(", ")}`, $$.annotation, DiagnosticSeverity.error)
                                            ee3.handlers.forEach(s => {
                                                return s.onProperty({
                                                    annotation: {
                                                        propKey: ee3.name,
                                                        definition: ee3.propDefinition,
                                                    },
                                                }).onTaggedUnion({
                                                    annotation: {
                                                        annotation: null,
                                                    },
                                                }).onUnexpectedOption({
                                                    data: {
                                                        optionString: $$.data,
                                                    },
                                                    annotation: {
                                                        annotation: $$.annotation,
                                                        //stateGroupDefinition: $,
                                                    },
                                                })
                                            })
                                            return p.value(false)
                                        } else {
                                            const state = stateGroup.setState(optionName, errorMessage => onError(errorMessage, $$.annotation, DiagnosticSeverity.error))
                                            addComments(stateGroup.comments, $$.annotation)
                                            if ($$$["default option"].get() !== option) {
                                                flagNonDefaultPropertiesFound()
                                            }

                                            stack.push(currentContext)
                                            currentContext = createNodeParser(
                                                option.node,
                                                ee3.handlers.map(h => {
                                                    return h.onProperty({
                                                        annotation: {
                                                            //annnotation: $$.annotation,
                                                            propKey: ee3.name,
                                                            definition: ee3.propDefinition,
                                                        },
                                                    }).onComponent()
                                                }),
                                                state.node,
                                                null,
                                            )
                                        }
                                        return p.value(false)
                                    }
                                    default:
                                        return assertUnreachable(ee2.propDefinition.type[0])
                                }
                            },
                            multilineString: $$ => {
                                switch (ee2.propDefinition.type[0]) {
                                    case "collection": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        switch ($$$.type[0]) {
                                            case "dictionary": {
                                                return createUnexpectedStringHandler(`expected a dictionary: '${ee2.name}'`, $$.annotation, onError)
                                            }
                                            case "list": {
                                                return createUnexpectedStringHandler(`expected a list: '${ee2.name}'`, $$.annotation, onError)
                                            }
                                            default:
                                                return assertUnreachable($$$.type[0])
                                        }
                                    }
                                    case "component": {
                                        const $$$ = ee2.propDefinition.type[1]
                                        return doComponent($$$).multilineString($$)
                                    }
                                    case "string": {
                                        const $ = ee2.propDefinition.type[1]

                                        return createMultilineStringDeserializer(
                                            $,
                                            ee2.name,
                                            ee3.nodeBuilder,
                                            ee2.handlers.map(s => {
                                                return s.onProperty({
                                                    annotation: {
                                                        propKey: ee2.name,
                                                        definition: ee2.propDefinition,
                                                    },
                                                })
                                            }),
                                            onError,
                                            flagNonDefaultPropertiesFound,
                                        )($$)
                                    }
                                    case "tagged union": {
                                        return createUnexpectedStringHandler(`expected a tagged union: '${ee2.name}'`, $$.annotation, onError)
                                    }
                                    default:
                                        return assertUnreachable(ee2.propDefinition.type[0])
                                }
                            },
                        }
                    }
                }
                return handleExpectedElement(ee)
            },
            arrayEnd: $$ => {

                addComments(targetComments, $$.annotation)

                function wrapup() {
                    const missing = currentContext.elements.length - currentContext.index
                    if (missing > 0) {
                        onError(`${missing} missing element(s): ${currentContext.elements.slice(currentContext.index).map(ee => `'${ee.name}'`).join(", ")}`, $$.annotation, DiagnosticSeverity.error)
                        for (let i = currentContext.index; i !== currentContext.elements.length; i += 1) {
                            const ee = currentContext.elements[i]

                            defaultInitializeProperty(
                                $$.annotation,
                                ee.propDefinition,
                                ee.name,
                                ee.nodeBuilder,
                                onError,
                            )
                        }
                    }
                    const previousContext = stack.pop()
                    if (previousContext !== undefined) {
                        currentContext.handlers.forEach(h => {
                            h.onShorthandTypeClose({
                                annotation: {
                                    annotation: null,
                                },
                            })
                        })
                        currentContext = previousContext
                        wrapup()
                    }
                }
                wrapup()
                currentContext.handlers.forEach(h => {
                    h.onShorthandTypeClose({
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