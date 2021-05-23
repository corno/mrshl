import * as p from "pareto"
import * as astn from "astn"
import * as md from "../types"
import * as syncAPI from "../syncAPI"
import * as sideEffects from "../ParsingSideEffectsAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError = (message: string, range: astn.Range) => void

function addComments(target: syncAPI.Comments, contextData: astn.ContextData) {
    contextData.before.comments.forEach(c => {
        target.addComment(c.text, c.type === "block" ? ["block"] : ["line"])
    })
    if (contextData.lineCommentAfter !== null) {
        target.addComment(contextData.lineCommentAfter.text, contextData.lineCommentAfter.type === "block" ? ["block"] : ["line"])
    }
}

function createPropertyDeserializer(
    context: astn.ExpectContext,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: syncAPI.Node,
    sideEffectsAPIs: sideEffects.Property[],
    onError: OnError,
    flagNonDefaultPropertiesFound: () => void,
    onNull: ((range: astn.Range, svData: astn.SimpleValueData) => p.IValue<boolean>) | null,
): astn.RequiredValueHandler {
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    const dictionary = nodeBuilder.getDictionary(propKey)
                    let hasEntries = false
                    let dictionarySideEffects: null | sideEffects.Dictionary[] = null


                    return context.expectValue(
                        valueContextData => {
                            addComments(dictionary.comments, valueContextData)

                            return context.expectDictionary(
                                (range, beginData) => {
                                    dictionarySideEffects = sideEffectsAPIs.map(s => {
                                        return s.onDictionary(range, beginData)
                                    })
                                },
                                (key, range, entryContextData) => {
                                    hasEntries = true
                                    const entry = dictionary.createEntry()
                                    //const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                                    entry.node.getValue($$["key property"].name).setValue(key, errorMessage => onError(errorMessage, range))
                                    addComments(entry.comments, entryContextData)


                                    if (dictionarySideEffects === null) {
                                        throw new Error("UNEXPECTED")
                                    }
                                    const propertySideEffects = dictionarySideEffects.map(s => {
                                        return s.onEntry(
                                            range,
                                            $$.node,
                                            $$["key property"].get(),
                                            entry
                                        )
                                    })
                                    return context.expectValue(
                                        createNodeDeserializer(
                                            context,
                                            $$.node,
                                            $$["key property"].get(),
                                            entry.node,
                                            $$["key property"].get(),
                                            propertySideEffects,
                                            onError,
                                            () => {
                                                //
                                            },
                                            entry.comments,
                                        ),
                                    )
                                },
                                (endRange, endData, endContextData) => {
                                    if (dictionarySideEffects === null) {
                                        throw new Error("UNEXPECTED")
                                    }
                                    dictionarySideEffects.forEach(s => {
                                        s.onClose(endRange, endData)
                                    })
                                    if (hasEntries) {
                                        flagNonDefaultPropertiesFound()
                                    }
                                    addComments(dictionary.comments, endContextData)

                                },
                                null,
                                (range, data) => {
                                    // sideEffectsAPIs.map(s => {
                                    //     return s.onDictionary(range, beginData)
                                    // })
                                    if (onNull !== null) {
                                        return onNull(range, data)
                                    }
                                    return p.value(false)
                                },
                            )
                        },
                    )
                }
                case "list": {
                    const $$ = $.type[1]
                    const list = nodeBuilder.getList(propKey)
                    let listSideEffects: null | sideEffects.List[] = null

                    let hasEntries = false
                    return context.expectValue(
                        valueContextData => {
                            addComments(list.comments, valueContextData)

                            return context.expectList(
                                (beginRange, beginData) => {
                                    listSideEffects = sideEffectsAPIs.map(s => {
                                        return s.onList(beginRange, beginData)
                                    })

                                },
                                () => {
                                    hasEntries = true
                                    const entry = list.createEntry()
                                    // const entry = collBuilder.createEntry(_errorMessage => {
                                    //     //onError(errorMessage, svData.range)
                                    // })
                                    if (listSideEffects === null) {
                                        throw new Error("UNEXPECTED")
                                    }
                                    const elementSideEffects = listSideEffects.map(s => {
                                        return s.onEntry()
                                    })
                                    return createNodeDeserializer(
                                        context,
                                        $$.node,
                                        null,
                                        entry.node,
                                        null,
                                        elementSideEffects,
                                        onError,
                                        () => {
                                            //
                                        },
                                        entry.comments,
                                    )
                                },
                                (endRange, endData, endContextData) => {
                                    if (hasEntries) {
                                        flagNonDefaultPropertiesFound()
                                    }
                                    if (listSideEffects === null) {
                                        throw new Error("UNEXPECTED")
                                    }
                                    listSideEffects.forEach(s => {
                                        s.onClose(endRange, endData)
                                    })
                                    addComments(list.comments, endContextData)

                                },
                                undefined,
                                range => { //onNull
                                    sideEffectsAPIs.map(s => {
                                        return s.onNull(range)
                                    })
                                    return p.value(false)
                                },
                            )
                        },
                    )
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = propDefinition.type[1]
            const componentBuilder = nodeBuilder.getComponent(propKey)
            return context.expectValue(
                createNodeDeserializer(
                    context,
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
                ),
            )
        }
        case "state group": {
            const $ = propDefinition.type[1]
            const stateGroup = nodeBuilder.getStateGroup(propKey)
            return context.expectValue(
                valueContextData => {
                    addComments(stateGroup.comments, valueContextData)
                    return context.expectTaggedUnion(
                        $.states.mapUnsorted((stateDef, stateName) => {
                            return (tuRange, optionRange, optionContextData) => {
                                const stateSideEffects = sideEffectsAPIs.map(s => {
                                    return s.onStateGroup().onState(
                                        stateName,
                                        tuRange,
                                        valueContextData,
                                        optionRange,
                                        optionContextData
                                    )
                                })

                                const state = stateGroup.setState(stateName, errorMessage => onError(errorMessage, optionRange))
                                addComments(stateGroup.comments, optionContextData)


                                if ($["default state"].get() !== stateDef) {
                                    flagNonDefaultPropertiesFound()
                                }
                                return context.expectValue(
                                    createNodeDeserializer(
                                        context,
                                        stateDef.node,
                                        null,
                                        state.node,
                                        null,
                                        stateSideEffects,
                                        onError,
                                        flagNonDefaultPropertiesFound,
                                        stateGroup.comments,
                                    ),
                                )
                            }
                        }),
                        (option, tuData, optionData, optionPreData) => {
                            sideEffectsAPIs.forEach(s => {
                                s.onStateGroup().onUnexpectedState(
                                    option,
                                    tuData,
                                    valueContextData,
                                    optionData,
                                    optionPreData,
                                    $,
                                )
                            })
                        },
                        undefined, //onMissingOption
                        undefined, // onInvalidType
                        range => { //onNull
                            sideEffectsAPIs.map(s => {
                                return s.onNull(range)
                            })
                            return p.value(false)
                        },
                    )
                },
            )
        }
        case "value": {
            const $ = propDefinition.type[1]
            const valueBuilder = nodeBuilder.getValue(propKey)

            return context.expectValue(
                valueContextData => {
                    addComments(valueBuilder.comments, valueContextData)

                    return context.expectSimpleValue(
                        (range, data) => {
                            if (data.value !== $["default value"]) {
                                flagNonDefaultPropertiesFound()
                            }
                            valueBuilder.setValue(data.value, errorMessage => onError(errorMessage, range))
                            if (data.quote !== null) {
                                if (!$.quoted) {
                                    onError(`value '${data.value}' must be unquoted`, range)
                                }
                            } else {
                                if ($.quoted) {
                                    onError(`value '${data.value}' must be quoted`, range)
                                }

                            }
                            //valueBuilder.setValue(value, svData.quote !== null, svData.range, comments)


                            sideEffectsAPIs.forEach(s => {
                                s.onValue(valueBuilder, range, data, $)
                            })
                            return p.value(false)
                        },
                        () => {
                            //
                        },
                        range => { //onNull
                            sideEffectsAPIs.map(s => {
                                return s.onNull(range)
                            })
                            return p.value(false)
                        },
                    )
                },
            )
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

function defaultInitializeNode(
    nodeDefinition: md.Node,
    nodeBuilder: syncAPI.Node,
    range: astn.Range,
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
    nodeBuilder: syncAPI.Node,
    range: astn.Range,
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
            nodeBuilder.getStateGroup(propKey).setState($["default state"].name, errorMessage => onError(errorMessage, range))
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

function getPropertyComments(node: syncAPI.Node, propertyName: string, propertyDefinition: md.Property): syncAPI.Comments {
    switch (propertyDefinition.type[0]) {
        case "component": {
            return node.getComponent(propertyName).comments
        }
        case "collection": {
            const $ = propertyDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    return node.getDictionary(propertyName).comments
                }
                case "list": {
                    return node.getList(propertyName).comments
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "state group": {
            return node.getStateGroup(propertyName).comments
        }
        case "value": {
            return node.getValue(propertyName).comments
        }
        default:
            return assertUnreachable(propertyDefinition.type[0])
    }
}

function createNodeDeserializer(
    context: astn.ExpectContext,
    nodeDefinition: md.Node,
    keyPropertyDefinition: md.Property | null,
    nodeBuilder: syncAPI.Node,
    keyProperty: md.Property | null,
    sideEffectsAPI: sideEffects.Node[],
    onError: OnError,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: syncAPI.Comments,
): astn.OnValue {

    return contextData => {
        addComments(targetComments, contextData)

        let shorthandTypeSideEffects: sideEffects.ShorthandType[] | null = null
        let typeSideEffects: sideEffects.Type[] | null = null

        const expectedElements: astn.ExpectedElements = []
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            if (propDefinition === keyPropertyDefinition) {
                return
            }
            expectedElements.push({
                name: propKey,
                getHandler: () => {
                    if (shorthandTypeSideEffects === null) {
                        throw new Error("missing shorthand side effects")
                    }
                    return createPropertyDeserializer(
                        context,
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        shorthandTypeSideEffects.map(s => {
                            return s.onProperty(
                                propKey,
                                propDefinition,
                                nodeBuilder,
                            )
                        }),
                        onError,
                        () => {
                            //
                        },
                        range => { //null value
                            defaultInitializeProperty(
                                propDefinition,
                                propKey,
                                nodeBuilder,
                                range,
                                onError,
                            )
                            return p.value(false)
                        },
                    )
                },
            })
        })

        const processedProperties: {
            [key: string]: {
                range: astn.Range
                isNonDefault: boolean
            }
        } = {}
        const expectedProperties: astn.ExpectedProperties = {}
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            if (keyProperty === propDefinition) {
                return
            }
            expectedProperties[propKey] = {
                onExists: (range, propertyContextData) => {
                    addComments(getPropertyComments(nodeBuilder, propKey, propDefinition), propertyContextData)
                    const processedProperty = {
                        range: range,
                        isNonDefault: false,
                    }
                    processedProperties[propKey] = processedProperty
                    if (typeSideEffects === null) {
                        throw new Error("missing type side effects")
                    }
                    return createPropertyDeserializer(
                        context,
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        typeSideEffects.map(s => {
                            return s.onProperty(
                                propKey,
                                range,
                                propDefinition,
                                nodeBuilder,
                            )
                        }),
                        onError,
                        () => {
                            processedProperty.isNonDefault = true
                        },
                        null,
                    )
                },
                onNotExists: beginRange => {
                    defaultInitializeProperty(
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        beginRange,
                        onError,
                    )
                },
            }
        })

        return context.expectTypeOrShorthandType(
            expectedProperties,
            expectedElements,
            (range, _openData) => { //onTypeBegin
                typeSideEffects = sideEffectsAPI.map(s => {
                    return s.onTypeOpen(
                        range,
                        nodeDefinition,
                        keyPropertyDefinition,
                        nodeBuilder,
                    )
                })
            },
            (_hasErrors, endRange, _closeData, endContextData) => { //onTypeEnd
                let hadNonDefaultProperties = false
                addComments(targetComments, endContextData)
                nodeDefinition.properties.forEach((_prop, propKey) => {
                    const processedProperty = processedProperties[propKey]
                    if (processedProperty !== undefined) {
                        if (!processedProperty.isNonDefault) {
                            onError(`property '${propKey}' has default value, remove`, processedProperty.range)
                        } else {
                            hadNonDefaultProperties = true
                        }
                    }
                })
                if (hadNonDefaultProperties) {
                    flagNonDefaultPropertiesFound()
                }
                if (typeSideEffects === null) {
                    throw new Error("missing type side effects")
                }
                typeSideEffects.forEach(s => {
                    s.onTypeClose(endRange)
                })
            },
            (key, metaData) => { //onUnexpectedProperty
                if (typeSideEffects === null) {
                    throw new Error("missing type side effects")
                }
                typeSideEffects.forEach(s => {
                    s.onUnexpectedProperty(
                        key,
                        metaData,
                        contextData,
                        Object.keys(expectedProperties),
                    )
                })
                return astn.createDummyRequiredValueHandler()
            },
            (startRange, _startData) => { //shorthand open
                shorthandTypeSideEffects = sideEffectsAPI.map(s => {
                    return s.onShorthandTypeOpen(
                        startRange,
                        nodeDefinition,
                        keyPropertyDefinition,
                        nodeBuilder,
                    )
                })

            },
            (endRange, endData, endContextData) => { //shorthand close
                if (shorthandTypeSideEffects === null) {
                    throw new Error("unexpected: no shorthand type side effect handlers")
                }
                shorthandTypeSideEffects.forEach(s => {
                    s.onShorthandTypeClose(endRange, endData)
                })
                addComments(targetComments, endContextData)
            },
            () => { //onInvalidType

            },
        )
    }

}

export function createDatasetDeserializer(
    context: astn.ExpectContext,
    dataset: syncAPI.IDataset,
    sideEffectsHandlers: sideEffects.Node[],
    onError: OnError,
): astn.RequiredValueHandler {
    return context.expectValue(
        createNodeDeserializer(
            context,
            dataset.schema["root type"].get().node,
            null,
            dataset.root,
            null,
            sideEffectsHandlers,
            onError,
            () => {
                //
            },
            dataset.rootComments
        ),
    )
}
