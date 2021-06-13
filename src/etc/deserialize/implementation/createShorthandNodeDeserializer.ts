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
        type PropertyContext = {
            name: string
            definition: def.PropertyDefinition
            nodeBuilder: buildAPI.Node
            nodeHandlers: sideEffectAPI.ShorthandTypeHandler<TokenAnnotation>[]
        }

        type ExpectedElements = PropertyContext[]

        type NodeContext = {
            elements: ExpectedElements
            handlers: sideEffectAPI.ShorthandTypeHandler<TokenAnnotation>[]
            index: number
        }

        function createNodeContext(
            definition: def.NodeDefinition,
            handlers: sideEffectAPI.NodeHandler<TokenAnnotation>[],
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
                        keyPropertyDefinition: keyPropertyDefinition,
                    },
                })
            })
            definition.properties.forEach((propDefinition, propKey) => {
                if (keyProperty === propDefinition) {
                    return
                }
                expectedElements.push({
                    name: propKey,
                    nodeBuilder: nb,
                    nodeHandlers: shorthandTypeHandlers,
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
            option: def.OptionDefinition
            handlers: sideEffectAPI.NodeHandler<TokenAnnotation>[]
            state: buildAPI.State
            stateGroup: buildAPI.StateGroup
        }

        let optionContext: null | OptionContext = null

        function pushMixedInNode(
            definition: def.NodeDefinition,
            handlers: sideEffectAPI.NodeHandler<TokenAnnotation>[],
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
                propertyContext.nodeHandlers.map(h => {
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
                eod.option.node,
                eod.handlers,
                eod.state.node,
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
        }): astncore.ObjectHandler<TokenAnnotation, NonTokenAnnotation> {
            if (optionContext !== null) {

                if ($$.data.type[0] === "verbose type") {
                    const oc = optionContext
                    optionContext = null

                    return createVerboseNodeDeserializer(
                        oc.option.node,
                        null,
                        oc.state.node,
                        null,
                        oc.handlers,
                        onError,
                        flagNonDefaultPropertiesFound,
                        oc.stateGroup.comments,
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
                return astncore.createDummyObjectHandler()
            }
            switch (nextProperty.definition.type[0]) {
                case "collection": {
                    const $$$ = nextProperty.definition.type[1]
                    switch ($$$.type[0]) {
                        case "dictionary": {
                            const $$$$ = $$$.type[1]
                            return createDictionaryDeserializer(
                                $$$$,
                                nextProperty.name,
                                nextProperty.nodeBuilder,
                                nextProperty.nodeHandlers.map(s => {
                                    return s.onProperty({
                                        annotation: {
                                            propKey: nextProperty.name,
                                            definition: nextProperty.definition,
                                        },
                                    })
                                }),
                                onError,
                                flagNonDefaultPropertiesFound,
                            )($$)
                        }
                        case "list": {
                            return createUnexpectedObjectHandler(`expected a list: '${nextProperty.name}'`, $$.annotation, onError)
                        }
                        default:
                            return assertUnreachable($$$.type[0])
                    }
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
                                null,
                                componentBuilder.node,
                                null,
                                nextProperty.nodeHandlers.map(s => {
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
                            )($$)
                        }
                        default:
                            return assertUnreachable($$.data.type[0])
                    }
                }
                case "string": {
                    return createUnexpectedObjectHandler(`expected a string: '${nextProperty.name}'`, $$.annotation, onError)
                }
                case "tagged union": {
                    return createUnexpectedObjectHandler(`expected a tagged union: '${nextProperty.name}'`, $$.annotation, onError)
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }

        const onArray: astncore.OnArray<TokenAnnotation, NonTokenAnnotation> = $$ => {
            if (optionContext !== null) {

                if ($$.data.type[0] === "shorthand type") {
                    //this must be the data of the tagged union
                    const oc = optionContext
                    optionContext = null

                    return createShorthandNodeDeserializer(
                        oc.option.node,
                        null,
                        oc.state.node,
                        null,
                        oc.handlers,
                        onError,
                        flagNonDefaultPropertiesFound,
                        oc.stateGroup.comments,
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
                return astncore.createDummyArrayHandler()
            }
            switch (nextProperty.definition.type[0]) {
                case "collection": {
                    const $$$ = nextProperty.definition.type[1]
                    switch ($$$.type[0]) {
                        case "dictionary": {
                            return createUnexpectedArrayHandler(`expected a dictionary: '${nextProperty.name}'`, $$.annotation, onError)
                        }
                        case "list": {
                            const $$$$ = $$$.type[1]
                            return createListDeserializer(
                                $$$$,
                                nextProperty.name,
                                nextProperty.nodeBuilder,
                                nextProperty.nodeHandlers.map(s => {
                                    return s.onProperty({
                                        annotation: {
                                            propKey: nextProperty.name,
                                            definition: nextProperty.definition,
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
                                null,
                                componentBuilder.node,
                                null,
                                nextProperty.nodeHandlers.map(s => {
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
                            )($$)
                        }
                        default:
                            return assertUnreachable($$.data.type[0])
                    }

                }
                case "string": {
                    return createUnexpectedArrayHandler(`expected a string: '${nextProperty.name}'`, $$.annotation, onError)
                }
                case "tagged union": {
                    return createUnexpectedArrayHandler(`expected a tagged union: '${nextProperty.name}'`, $$.annotation, onError)
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }

        const onTaggedUnion: astncore.OnTaggedUnion<TokenAnnotation, NonTokenAnnotation> = $$ => {
            if (optionContext !== null) {
                pushMixedInTaggedUnionData(optionContext)

                optionContext = null
                return onTaggedUnion($$)
            }
            const nextProperty = findNextProperty()
            if (nextProperty === null) {
                onError(`superfluous element: tagged union`, $$.annotation, DiagnosticSeverity.error)
                return astncore.createDummyValueHandler().taggedUnion($$)
            }
            switch (nextProperty.definition.type[0]) {
                case "collection": {
                    const $$$ = nextProperty.definition.type[1]
                    switch ($$$.type[0]) {
                        case "dictionary": {
                            return createUnexpectedTaggedUnionHandler(`expected a dictionary: '${nextProperty.name}'`, $$.annotation, onError)
                        }
                        case "list": {
                            return createUnexpectedTaggedUnionHandler(`expected a list: '${nextProperty.name}'`, $$.annotation, onError)
                        }
                        default:
                            return assertUnreachable($$$.type[0])
                    }
                }
                case "component": {
                    const $$$ = nextProperty.definition.type[1]
                    pushMixedInComponent($$$, nextProperty)
                    return onTaggedUnion($$)
                }
                case "string": {
                    return createUnexpectedTaggedUnionHandler(`expected a string: '${nextProperty.name}'`, $$.annotation, onError)
                }
                case "tagged union": {
                    const $ = nextProperty.definition.type[1]
                    return createTaggedUnionDeserializer(
                        $,
                        nextProperty.name,
                        nextProperty.nodeBuilder,
                        nextProperty.nodeHandlers.map(s => {
                            return s.onProperty({
                                annotation: {
                                    propKey: nextProperty.name,
                                    definition: nextProperty.definition,
                                },
                            })
                        }),
                        onError,
                        flagNonDefaultPropertiesFound,
                    )($$)
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }

        const onSimpleString: astncore.OnSimpleString<TokenAnnotation> = $$ => {
            if (optionContext !== null) {
                pushMixedInTaggedUnionData(optionContext)

                optionContext = null
                return onSimpleString($$)
            }
            const nextProperty = findNextProperty()
            if (nextProperty === null) {
                onError(`superfluous element ('${$$.data.value}')`, $$.annotation, DiagnosticSeverity.error)
                return p.value(false)
            }
            switch (nextProperty.definition.type[0]) {
                case "collection": {
                    const $$$ = nextProperty.definition.type[1]
                    switch ($$$.type[0]) {
                        case "dictionary": {
                            return createUnexpectedStringHandler(`expected a dictionary: '${nextProperty.name}'`, $$.annotation, onError)
                        }
                        case "list": {
                            return createUnexpectedStringHandler(`expected a list: '${nextProperty.name}'`, $$.annotation, onError)
                        }
                        default:
                            return assertUnreachable($$$.type[0])
                    }
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
                        nextProperty.nodeHandlers.map(s => {
                            return s.onProperty({
                                annotation: {
                                    propKey: nextProperty.name,
                                    definition: nextProperty.definition,
                                },
                            })
                        }),
                        onError,
                        flagNonDefaultPropertiesFound,
                    )($$)
                }
                case "tagged union": {
                    const $$$ = nextProperty.definition.type[1]

                    if ($$.data.wrapping[0] !== "apostrophe") {
                        onError(`this is interpreted as an option, expected apostrophes`, $$.annotation, DiagnosticSeverity.warning)
                    }

                    const optionName = $$.data.value
                    const option = $$$.options.get(optionName)
                    const stateGroup = nextProperty.nodeBuilder.getTaggedUnion(nextProperty.name)
                    addComments(stateGroup.comments, $$.annotation)

                    const tuHandlers = nextProperty.nodeHandlers.map(s => {
                        return s.onProperty({
                            annotation: {
                                propKey: nextProperty.name,
                                definition: nextProperty.definition,
                            },
                        }).onTaggedUnion({
                            annotation: {
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
                        return p.value(false)
                    } else {
                        const state = stateGroup.setState(optionName, errorMessage => onError(errorMessage, $$.annotation, DiagnosticSeverity.error))
                        addComments(stateGroup.comments, $$.annotation)
                        if ($$$["default option"].get() !== option) {
                            flagNonDefaultPropertiesFound()
                        }
                        optionContext = {
                            option: option,
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
                            state: state,
                            stateGroup: stateGroup,
                        }
                    }
                    return p.value(false)
                }
                default:
                    return assertUnreachable(nextProperty.definition.type[0])
            }
        }

        const onMultilineString: astncore.OnMultilineString<TokenAnnotation> = $$ => {
            if (optionContext !== null) {
                pushMixedInTaggedUnionData(optionContext)
                optionContext = null
                return onMultilineString($$)
            }
            const nextProperty = findNextProperty()
            if (nextProperty === null) {
                onError(`superfluous element ('${$$.data.lines.join("\n")}')`, $$.annotation, DiagnosticSeverity.error)
                return p.value(false)
            }
            switch (nextProperty.definition.type[0]) {
                case "collection": {
                    const $$$ = nextProperty.definition.type[1]
                    switch ($$$.type[0]) {
                        case "dictionary": {
                            return createUnexpectedStringHandler(`expected a dictionary: '${nextProperty.name}'`, $$.annotation, onError)
                        }
                        case "list": {
                            return createUnexpectedStringHandler(`expected a list: '${nextProperty.name}'`, $$.annotation, onError)
                        }
                        default:
                            return assertUnreachable($$$.type[0])
                    }
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
                        nextProperty.nodeHandlers.map(s => {
                            return s.onProperty({
                                annotation: {
                                    propKey: nextProperty.name,
                                    definition: nextProperty.definition,
                                },
                            })
                        }),
                        onError,
                        flagNonDefaultPropertiesFound,
                    )($$)
                }
                case "tagged union": {
                    return createUnexpectedStringHandler(`expected a tagged union: '${nextProperty.name}'`, $$.annotation, onError)
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

                return p.value(null)
            },
        }
    }
}