import * as bc from "bass-clarinet-typed"
import * as md from "../metaDataSchema"
import * as ds from "../datasetAPI"
import { SideEffectsAPI } from "./SideEffectsAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError = (message: string, range: bc.Range) => void

function createPropertyDeserializer(
    context: bc.ExpectContext,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: ds.NodeBuilder,
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
                                (key, propertyData, preData) => {

                                    const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                                    entry.node.getValue($$$["key property"].getName()).setValue(key, errorMessage => onError(errorMessage, propertyData.keyRange))
                                    entry.setComments(preData.comments.map(c => c.text))

                                    registerSnippetGenerators.onDictionaryEntry(
                                        propertyData,
                                        $$$.node,
                                        $$$["key property"].get(),
                                        entry
                                    )
                                    return createNodeDeserializer(
                                        context,
                                        $$$.node,
                                        $$$["key property"].get(),
                                        entry.node,
                                        isCompact,
                                        $$$["key property"].get(),
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
                                        null,
                                        entry.node,
                                        isCompact,
                                        null,
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
                null,
                componentBuilder.node,
                isCompact,
                null,
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
                            null,
                            state.node,
                            isCompact,
                            null,
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


function defaultInitializeNode(
    nodeDefinition: md.Node,
    nodeBuilder: ds.NodeBuilder,
    range: bc.Range,
    onError: OnError,
) {
    nodeDefinition.properties.forEach((propDef, propKey) => {
         defaultInitializeProperty(
            propDef,
            propKey,
            nodeBuilder,
            range,
            onError,
         )
    })
}


function defaultInitializeProperty(
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: ds.NodeBuilder,
    range: bc.Range,
    onError: OnError,
) {

    switch (propDefinition.type[0]) {
        case "collection": {
            //nothing to do
            break
        }
        case "component": {
            const $ = propDefinition.type[1]
            defaultInitializeNode(
                $.type.get().node,
                nodeBuilder.getComponent(propKey).node,
                range,
                onError,
            )
            break
        }
        case "state group": {
            const $ = propDefinition.type[1]
            nodeBuilder.getStateGroup(propKey).setState($["default state"].getName(), errorMessage => onError(errorMessage, range))
            break
        }
        case "value": {
            const $ = propDefinition.type[1]
            nodeBuilder.getValue(propKey).setValue($["default value"], errorMessage => onError(errorMessage, range))
            break
        }
        default:
            assertUnreachable(propDefinition.type[0])
    }
}

function createNodeDeserializer(
    context: bc.ExpectContext,
    nodeDefinition: md.Node,
    keyPropertyDefinition: md.Property | null,
    nodeBuilder: ds.NodeBuilder,
    isCompact: boolean,
    keyProperty: md.Property | null,
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
            if (keyProperty === propDefinition) {
                return
            }
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
                onNotExists: beginData => {
                    console.log("HANDLING MISSING PROPERTY")
                    defaultInitializeProperty(
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        beginData.start,
                        onError,
                    )
                },
            }
        })
        return context.expectType(
            startRange => {
                sideEffectsAPI.onTypeOpen(
                    startRange,
                    nodeDefinition,
                    keyPropertyDefinition,
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

export function createDatasetDeserializer(
    context: bc.ExpectContext,
    dataset: ds.Dataset,
    isCompact: boolean,
    sideEffectsAPI: SideEffectsAPI,
    onError: OnError,
): bc.ValueHandler {
    return createNodeDeserializer(
        context,
        dataset.schema["root type"].get().node,
        null,
        dataset.root, isCompact,
        null,
        sideEffectsAPI,
        onError
    )
}
