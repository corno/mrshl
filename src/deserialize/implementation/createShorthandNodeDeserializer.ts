import * as astncore from "astn-core"
import * as buildAPI from "../interfaces/buildAPI"
import * as def from "../interfaces/typedParserDefinitions"
import * as sideEffectAPI from "../interfaces/streamingValidationAPI"
import { DiagnosticSeverity } from "../interfaces/DiagnosticSeverity"
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

export function createShorthandNodeDeserializer<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    nodeDefinition: def.NodeDefinition,
    nodeBuilderX: buildAPI.Node,
    sideEffectsAPIsX: sideEffectAPI.ValueHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: buildAPI.Comments,
    createReturnValue: () => ReturnType
): astncore.OnArray<TokenAnnotation, NonTokenAnnotation, ReturnType> {
    return $3 => {
        if ($3.data.type[0] !== "shorthand type") {
            onError("array is not a shorthand type", $3.annotation, DiagnosticSeverity.error)
        }
        type PropertyContext = {
            name: string
            definition: def.PropertyDefinition
            nodeBuilder: buildAPI.Node
            ValueHandlers: sideEffectAPI.ShorthandTypeHandler<TokenAnnotation>[]
        }

        type ExpectedElements = PropertyContext[]

        type NodeContext = {
            elements: ExpectedElements
            handlers: sideEffectAPI.ShorthandTypeHandler<TokenAnnotation>[]
            index: number
        }

        function createNodeContext(
            definition: def.NodeDefinition,
            handlers: sideEffectAPI.ValueHandler<TokenAnnotation>[],
            nb: buildAPI.Node,
            ann: TokenAnnotation | null,
        ): NodeContext {
            const expectedElements: ExpectedElements = []
            const shorthandTypeHandlers = handlers.map(s => {
                return s.onShorthandTypeOpen({
                    data: $3.data,
                    annotation: {
                        annotation: ann,
                        nodeDefinition: nodeDefinition,
                    },
                })
            })
            definition.properties.forEach((propDefinition, propKey) => {
                expectedElements.push({
                    name: propKey,
                    nodeBuilder: nb,
                    ValueHandlers: shorthandTypeHandlers,
                    definition: propDefinition,
                })
            })
            return {
                elements: expectedElements,
                handlers: shorthandTypeHandlers,
                index: 0,
            }
        }


        const stack: NodeContext[] = []
        let currentContext = createNodeContext(
            nodeDefinition,
            sideEffectsAPIsX,
            nodeBuilderX,
            $3.annotation,
        )

        type OptionContext = {
            definition: def.OptionDefinition
            handlers: sideEffectAPI.ValueHandler<TokenAnnotation>[]
            option: buildAPI.Option
            taggedUnion: buildAPI.TaggedUnion
        }

        let optionContext: null | OptionContext = null

        function pushMixedInNode(
            definition: def.NodeDefinition,
            handlers: sideEffectAPI.ValueHandler<TokenAnnotation>[],
            nodeBuilder: buildAPI.Node,
        ) {
            stack.push(currentContext)
            currentContext = createNodeContext(
                definition,
                handlers,
                nodeBuilder,
                null,
            )
        }

        function pushMixedInComponent(
            definition: def.ComponentDefinition,
            propertyContext: PropertyContext
        ) {
            pushMixedInNode(
                definition.type.get().node,
                propertyContext.ValueHandlers.map(h => {
                    return h.onProperty({
                        annotation: {
                            //annnotation: $$.annotation,
                            propKey: propertyContext.name,
                            definition: propertyContext.definition,
                        },
                    }).onComponent()
                }),
                propertyContext.nodeBuilder.getComponent(propertyContext.name).node
            )
        }

        function pushMixedInTaggedUnionData(eod: OptionContext) {
            pushMixedInNode(
                eod.definition.node,
                eod.handlers,
                eod.option.node,
            )
        }

        function findNextProperty(): null | PropertyContext {
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

        function handleObject($$: {
            data: astncore.ObjectData
            annotation: TokenAnnotation
            stackContext: astncore.StackContext
        }): astncore.ObjectHandler<TokenAnnotation, NonTokenAnnotation, ReturnType> {
            if (optionContext !== null) {

                if ($$.data.type[0] === "verbose type") {
                    const oc = optionContext
                    optionContext = null

                    return createVerboseNodeDeserializer(
                        oc.definition.node,
                        oc.option.node,
                        oc.handlers,
                        onError,
                        flagNonDefaultPropertiesFound,
                        oc.taggedUnion.comments,
                        createReturnValue,
                    )($$)
                } else {
                    pushMixedInTaggedUnionData(optionContext)
                    optionContext = null
                    return handleObject($$)
                }

            }
            const nextProperty = findNextProperty()

            if (nextProperty === null) {
                onError(`superfluous element: object`, $$.annotation, DiagnosticSeverity.error)
                return astncore.createDummyObjectHandler(createReturnValue)
            }
            switch (nextProperty.definition.type[0]) {
                case "dictionary": {
                    const $$$$ = nextProperty.definition.type[1]
                    return createDictionaryDeserializer(
                        $$$$,
                        nextProperty.name,
                        nextProperty.nodeBuilder,
                        nextProperty.ValueHandlers.map(s => {
                            return s.onProperty({
                                annotation: {
                                    propKey: nextProperty.name,
                                    definition: nextProperty.definition,
                                },
                            })
                        }),
                        onError,
                        flagNonDefaultPropertiesFound,
                        createReturnValue,
                    )($$)
                }
                case "list": {
                    return createUnexpectedObjectHandler(
                        `expected a list: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "component": {
                    const $$$ = nextProperty.definition.type[1]
                    switch ($$.data.type[0]) {
                        case "dictionary": {
                            pushMixedInComponent($$$, nextProperty)
                            return handleObject($$)
                        }
                        case "verbose type": {
                            const $ = nextProperty.definition.type[1]
                            const componentBuilder = nextProperty.nodeBuilder.getComponent(nextProperty.name)
                            return createVerboseNodeDeserializer(
                                $.type.get().node,
                                componentBuilder.node,
                                nextProperty.ValueHandlers.map(s => {
                                    return s.onProperty({
                                        annotation: {
                                            propKey: nextProperty.name,
                                            definition: nextProperty.definition,
                                        },
                                    }).onComponent()
                                }),
                                onError,
                                flagNonDefaultPropertiesFound,
                                componentBuilder.comments,
                                createReturnValue,
                            )($$)
                        }
                        default:
                            return assertUnreachable($$.data.type[0])
                    }
                }
                case "string": {
                    return createUnexpectedObjectHandler(
                        `expected a string: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "tagged union": {
                    return createUnexpectedObjectHandler(
                        `expected a tagged union: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }

        const onArray: astncore.OnArray<TokenAnnotation, NonTokenAnnotation, ReturnType> = $$ => {
            if (optionContext !== null) {

                if ($$.data.type[0] === "shorthand type") {
                    //this must be the data of the tagged union
                    const oc = optionContext
                    optionContext = null

                    return createShorthandNodeDeserializer(
                        oc.definition.node,
                        oc.option.node,
                        oc.handlers,
                        onError,
                        flagNonDefaultPropertiesFound,
                        oc.taggedUnion.comments,
                        createReturnValue,
                    )($$)

                } else {
                    pushMixedInTaggedUnionData(optionContext)
                    optionContext = null
                    return onArray($$)
                }
            }
            const nextProperty = findNextProperty()

            if (nextProperty === null) {
                onError(`superfluous element: array`, $$.annotation, DiagnosticSeverity.error)
                return astncore.createDummyArrayHandler(createReturnValue)
            }
            switch (nextProperty.definition.type[0]) {
                case "dictionary": {
                    return createUnexpectedArrayHandler(
                        `expected a dictionary: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "list": {
                    const $$$$ = nextProperty.definition.type[1]
                    return createListDeserializer(
                        $$$$,
                        nextProperty.name,
                        nextProperty.nodeBuilder,
                        nextProperty.ValueHandlers.map(s => {
                            return s.onProperty({
                                annotation: {
                                    propKey: nextProperty.name,
                                    definition: nextProperty.definition,
                                },
                            })
                        }),
                        onError,
                        flagNonDefaultPropertiesFound,
                        createReturnValue,
                    )($$)
                }
                case "component": {
                    const $$$ = nextProperty.definition.type[1]

                    switch ($$.data.type[0]) {
                        case "list": {
                            pushMixedInComponent($$$, nextProperty)
                            return onArray($$)
                        }
                        case "shorthand type": {
                            const $ = nextProperty.definition.type[1]
                            const componentBuilder = nextProperty.nodeBuilder.getComponent(nextProperty.name)
                            return createShorthandNodeDeserializer(
                                $.type.get().node,
                                componentBuilder.node,
                                nextProperty.ValueHandlers.map(s => {
                                    return s.onProperty({
                                        annotation: {
                                            propKey: nextProperty.name,
                                            definition: nextProperty.definition,
                                        },
                                    }).onComponent()
                                }),
                                onError,
                                flagNonDefaultPropertiesFound,
                                componentBuilder.comments,
                                createReturnValue,
                            )($$)
                        }
                        default:
                            return assertUnreachable($$.data.type[0])
                    }

                }
                case "string": {
                    return createUnexpectedArrayHandler(
                        `expected a string: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "tagged union": {
                    return createUnexpectedArrayHandler(
                        `expected a tagged union: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }

        const onTaggedUnion: astncore.OnTaggedUnion<TokenAnnotation, NonTokenAnnotation, ReturnType> = $$ => {
            if (optionContext !== null) {
                pushMixedInTaggedUnionData(optionContext)

                optionContext = null
                return onTaggedUnion($$)
            }
            const nextProperty = findNextProperty()
            if (nextProperty === null) {
                onError(`superfluous element: tagged union`, $$.annotation, DiagnosticSeverity.error)
                return astncore.createDummyValueHandler(createReturnValue).taggedUnion($$)
            }
            switch (nextProperty.definition.type[0]) {
                case "dictionary": {
                    return createUnexpectedTaggedUnionHandler(
                        `expected a dictionary: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "list": {
                    return createUnexpectedTaggedUnionHandler(
                        `expected a list: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "component": {
                    const $$$ = nextProperty.definition.type[1]
                    pushMixedInComponent($$$, nextProperty)
                    return onTaggedUnion($$)
                }
                case "string": {
                    return createUnexpectedTaggedUnionHandler(
                        `expected a string: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "tagged union": {
                    const $ = nextProperty.definition.type[1]
                    return createTaggedUnionDeserializer(
                        $,
                        nextProperty.name,
                        nextProperty.nodeBuilder,
                        nextProperty.ValueHandlers.map(s => {
                            return s.onProperty({
                                annotation: {
                                    propKey: nextProperty.name,
                                    definition: nextProperty.definition,
                                },
                            })
                        }),
                        onError,
                        flagNonDefaultPropertiesFound,
                        createReturnValue,
                    )($$)
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }

        const onSimpleString: astncore.OnSimpleString<TokenAnnotation, ReturnType> = $$ => {
            if (optionContext !== null) {
                pushMixedInTaggedUnionData(optionContext)

                optionContext = null
                return onSimpleString($$)
            }
            const nextProperty = findNextProperty()
            if (nextProperty === null) {
                onError(`superfluous element ('${$$.data.value}')`, $$.annotation, DiagnosticSeverity.error)
                return createReturnValue()
            }
            switch (nextProperty.definition.type[0]) {
                case "dictionary": {
                    return createUnexpectedStringHandler(
                        `expected a dictionary: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "list": {
                    return createUnexpectedStringHandler(
                        `expected a list: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "component": {
                    const $$$ = nextProperty.definition.type[1]
                    pushMixedInComponent($$$, nextProperty)
                    return onSimpleString($$)
                }
                case "string": {
                    const $ = nextProperty.definition.type[1]
                    return createSimpleStringDeserializer(
                        $,
                        nextProperty.name,
                        nextProperty.nodeBuilder,
                        nextProperty.ValueHandlers.map(s => {
                            return s.onProperty({
                                annotation: {
                                    propKey: nextProperty.name,
                                    definition: nextProperty.definition,
                                },
                            })
                        }),
                        onError,
                        flagNonDefaultPropertiesFound,
                        createReturnValue,
                    )($$)
                }
                case "tagged union": {
                    const $$$ = nextProperty.definition.type[1]

                    if ($$.data.wrapping[0] !== "apostrophe") {
                        onError(`this is interpreted as an option, expected apostrophes`, $$.annotation, DiagnosticSeverity.warning)
                    }

                    const optionName = $$.data.value
                    const option = $$$.options.get(optionName)
                    const taggedUnion = nextProperty.nodeBuilder.getTaggedUnion(nextProperty.name)
                    addComments(taggedUnion.comments, $$.annotation)

                    const tuHandlers = nextProperty.ValueHandlers.map(s => {
                        return s.onProperty({
                            annotation: {
                                propKey: nextProperty.name,
                                definition: nextProperty.definition,
                            },
                        }).onTaggedUnion({
                            annotation: {
                                definition: $$$,
                                annotation: null,
                            },
                        })
                    })

                    if (option === null) {
                        onError(`unknown option: '${optionName}', choose from: ${$$$.options.getKeys().map(k => `'${k}'`).join(", ")}`, $$.annotation, DiagnosticSeverity.error)
                        tuHandlers.forEach(s => {
                            return s.onUnexpectedOption({
                                data: {
                                    optionString: $$.data,
                                },
                                annotation: {
                                    annotation: $$.annotation,
                                    //stateGroupDefinition: $,
                                },
                            })
                        })
                        return createReturnValue()
                    } else {
                        const state = taggedUnion.setState(optionName, errorMessage => onError(errorMessage, $$.annotation, DiagnosticSeverity.error))
                        addComments(taggedUnion.comments, $$.annotation)
                        if ($$$["default option"].get() !== option) {
                            flagNonDefaultPropertiesFound()
                        }
                        optionContext = {
                            definition: option,
                            handlers: tuHandlers.map(h => {
                                return h.onOption({
                                    data: {
                                        optionString: $$.data,
                                    },
                                    annotation: {
                                        annotation: $$.annotation,
                                        definition: option,
                                    },
                                })
                            }),
                            option: state,
                            taggedUnion: taggedUnion,
                        }
                    }
                    return createReturnValue()
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }

        const onMultilineString: astncore.OnMultilineString<TokenAnnotation, ReturnType> = ($$): ReturnType => {
            if (optionContext !== null) {
                pushMixedInTaggedUnionData(optionContext)
                optionContext = null
                return onMultilineString($$)
            }
            const nextProperty = findNextProperty()
            if (nextProperty === null) {
                onError(`superfluous element ('${$$.data.lines.join("\n")}')`, $$.annotation, DiagnosticSeverity.error)
                return createReturnValue()
            }
            switch (nextProperty.definition.type[0]) {
                case "dictionary": {
                    return createUnexpectedStringHandler(
                        `expected a dictionary: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "list": {
                    return createUnexpectedStringHandler(
                        `expected a list: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                case "component": {
                    const $$$ = nextProperty.definition.type[1]
                    pushMixedInComponent($$$, nextProperty)
                    return onMultilineString($$)
                }
                case "string": {
                    const $ = nextProperty.definition.type[1]

                    return createMultilineStringDeserializer(
                        $,
                        nextProperty.name,
                        nextProperty.nodeBuilder,
                        nextProperty.ValueHandlers.map(s => {
                            return s.onProperty({
                                annotation: {
                                    propKey: nextProperty.name,
                                    definition: nextProperty.definition,
                                },
                            })
                        }),
                        onError,
                        flagNonDefaultPropertiesFound,
                        createReturnValue,
                    )($$)
                }
                case "tagged union": {
                    return createUnexpectedStringHandler(
                        `expected a tagged union: '${nextProperty.name}'`,
                        $$.annotation,
                        onError,
                        createReturnValue,
                    )
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }
        return {
            element: () => {
                return {
                    object: $$ => handleObject($$),
                    array: $$ => onArray($$),
                    taggedUnion: $1 => onTaggedUnion($1),
                    simpleString: $$ => onSimpleString($$),
                    multilineString: $$ => onMultilineString($$),
                }
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
                                ee.definition,
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

                return createReturnValue()
            },
        }
    }
}