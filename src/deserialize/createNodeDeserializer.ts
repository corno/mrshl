import * as bc from "bass-clarinet"
import * as md from "../metaDataSchema"
import { NodeBuilder } from "../builderAPI"
import { SideEffectsAPI } from "./SideEffectsAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError = (message: string, range: bc.Range) => void

function createPropertyDeserializer(
    context: bc.ExpectContext,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: NodeBuilder,
    isCompact: boolean,
    registerSnippetGenerators: SideEffectsAPI,
    onError: OnError,
): bc.ValueHandler {
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectDictionary(
                                openData => {
                                    registerSnippetGenerators.onDictionaryOpen(openData)
                                },
                                (_key, propertyData) => {
                                    registerSnippetGenerators.onUnexpectedDictionaryEntry(
                                        propertyData,
                                    )
                                    return context.expectNothing()
                                },
                                endData => {
                                    registerSnippetGenerators.onDictionaryClose(endData)
                                },
                            )
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            const collBuilder = nodeBuilder.getDictionary(propKey)
                            return context.expectDictionary(
                                beginData => {
                                    registerSnippetGenerators.onDictionaryOpen(beginData)
                                },
                                (_key, propertyData, preData) => {

                                    const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                                    entry.setComments(preData.comments.map(c => c.text))

                                    registerSnippetGenerators.onDictionaryEntry(
                                        propertyData,
                                        $$$.node,
                                        entry
                                    )
                                    return createNodeDeserializer(
                                        context,
                                        $$$.node,
                                        entry.node,
                                        isCompact,
                                        registerSnippetGenerators,
                                        onError,
                                    )
                                },
                                endData => {
                                    registerSnippetGenerators.onDictionaryClose(endData)
                                },
                            )
                        }
                        default:
                            return assertUnreachable($$["has instances"][0])
                    }
                }
                case "list": {
                    const $$ = $.type[1]

                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectList(
                                beginData => {
                                    registerSnippetGenerators.onListOpen(beginData)
                                },
                                () => {
                                    registerSnippetGenerators.onListEntry()
                                    return context.expectNothing()
                                },
                                endData => {
                                    registerSnippetGenerators.onListClose(endData)
                                },
                            )
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            const collBuilder = nodeBuilder.getList(propKey)
                            return context.expectList(
                                beginData => {
                                    registerSnippetGenerators.onListOpen(beginData)
                                },
                                () => {
                                    const entry = collBuilder.createEntry(_errorMessage => {
                                        //onError(errorMessage, svData.range)
                                    })
                                    registerSnippetGenerators.onListEntry()

                                    return createNodeDeserializer(
                                        context,
                                        $$$.node,
                                        entry.node,
                                        isCompact,
                                        registerSnippetGenerators,
                                        onError,
                                    )
                                },
                                endData => {
                                    registerSnippetGenerators.onListClose(endData)
                                },
                            )
                        }
                        default:
                            return assertUnreachable($$["has instances"][0])
                    }
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = propDefinition.type[1]
            const componentBuilder = nodeBuilder.getComponent(propKey)
            return createNodeDeserializer(
                context,
                $.type.get().node,
                componentBuilder.node,
                isCompact,
                registerSnippetGenerators,
                onError,
            )
        }
        case "state group": {
            const $ = propDefinition.type[1]
            return context.expectTaggedUnion(
                $.states.map((stateDef, stateName) => {
                    return (tuData, tuPreData, optionPreData) => {
                        registerSnippetGenerators.onState(stateName, tuData, tuPreData, optionPreData)
                        const stateGroup = nodeBuilder.getStateGroup(propKey)
                        stateGroup.setComments(tuPreData.comments.map(c => c.text))
                        const state = stateGroup.setState(stateName, errorMessage => onError(errorMessage, tuData.optionRange))
                        state.setComments(optionPreData.comments.map(c => c.text))
                        return createNodeDeserializer(
                            context,
                            stateDef.node,
                            state.node,
                            isCompact,
                            registerSnippetGenerators,
                            onError
                        )
                    }
                }),
                (option, tuData, beginPreData, optionPreData) => {
                    registerSnippetGenerators.onUnexpectedState(
                        option,
                        tuData,
                        beginPreData,
                        optionPreData,
                        $,
                    )
                },
            )
        }
        case "value": {
            const $ = propDefinition.type[1]
            return context.expectSimpleValue((value, svData, preData) => {
                const valueBuilder = nodeBuilder.getValue(propKey)
                valueBuilder.setValue(value, errorMessage => onError(errorMessage, svData.range))
                if (svData.quote !== null) {
                    if (!$.quoted) {
                        onError(`value '${value}' must be unquoted`, svData.range)
                    }
                } else {
                    if ($.quoted) {
                        onError(`value '${value}' must be quoted`, svData.range)
                    }

                }
                //valueBuilder.setValue(value, svData.quote !== null, svData.range, comments)
                valueBuilder.setComments(preData.comments.map(c => c.text))
                registerSnippetGenerators.onValue(svData, valueBuilder)
            })
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

export function createNodeDeserializer(
    context: bc.ExpectContext,
    nodeDefinition: md.Node,
    nodeBuilder: NodeBuilder,
    isCompact: boolean,
    sideEffectsAPI: SideEffectsAPI,
    onError: OnError,
): bc.ValueHandler {
    if (isCompact) {
        const expectedElements: bc.ExpectedElements = []
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedElements.push(() => {
                return createPropertyDeserializer(
                    context,
                    propDefinition,
                    propKey,
                    nodeBuilder,
                    isCompact,
                    sideEffectsAPI,
                    onError,
                )
            })
        })
        return context.expectArrayType(
            startData => {
                sideEffectsAPI.onArrayTypeOpen(startData)
            },
            expectedElements,
            endData => {
                sideEffectsAPI.onArrayTypeClose(endData)
            }
        )

    } else {
        const expectedProperties: bc.ExpectedProperties = {}
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedProperties[propKey] = {
                onExists: propertyData => {
                    sideEffectsAPI.onProperty(
                        propertyData,
                        propKey,
                        propDefinition,
                        nodeBuilder,
                    )
                    return createPropertyDeserializer(
                        context,
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        isCompact,
                        sideEffectsAPI,
                        onError,
                    )
                },
                onNotExists: () => {
                    //
                },
            }
        })
        return context.expectType(
            startRange => {
                sideEffectsAPI.onTypeOpen(
                    startRange,
                    nodeDefinition,
                    nodeBuilder,
                )
            },
            expectedProperties,
            (_hasErrors, endRange) => {
                sideEffectsAPI.onTypeClose(endRange)
            },
            (key, metaData, preData) => {
                sideEffectsAPI.onUnexpectedProperty(
                    key,
                    metaData,
                    preData,
                    Object.keys(expectedProperties),
                )
            },
        )

    }

}
