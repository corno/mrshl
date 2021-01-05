import * as p from "pareto"
import * as bc from "bass-clarinet-typed"
import * as md from "../types"
import * as syncAPI from "../syncAPI"
import * as sideEffects from "../SideEffectsAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError = (message: string, range: bc.Range) => void

function doComments(contextData: bc.ContextData, target: syncAPI.Comments) {
    contextData.commentsBefore.map(c => {
        console.log("HIER AC")
        target.addComment(c.text)
    })

}

function createPropertyDeserializer(
    context: bc.ExpectContext,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: syncAPI.Node,
    isCompact: boolean,
    sideEffectsAPIs: sideEffects.Node[],
    onError: OnError,
    flagIsDirty: () => void,
): bc.RequiredValueHandler {
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    const dictionary = nodeBuilder.getDictionary(propKey)
                    let hasEntries = false
                    let dictionarySideEffects: null | sideEffects.Dictionary[] = null


                    return context.expectValue(contextData => {
                        doComments(contextData, dictionary.beginComments)
                        return context.expectDictionary(
                            (key, range, entryContextData) => {
                                hasEntries = true
                                const entry = dictionary.createEntry()
                                //const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                                entry.node.getValue($$["key property"].name).setValue(key, errorMessage => onError(errorMessage, range))
                                doComments(entryContextData, entry.comments)


                                if (dictionarySideEffects === null) {
                                    throw new Error("UNEXPECTED")
                                }
                                const propertySideEffects = dictionarySideEffects.map(s => {
                                    return s.onDictionaryEntry(
                                        range,
                                        $$.node,
                                        $$["key property"].get(),
                                        entry
                                    )
                                })
                                return context.expectValue(createNodeDeserializer(
                                    context,
                                    $$.node,
                                    $$["key property"].get(),
                                    entry.node,
                                    isCompact,
                                    $$["key property"].get(),
                                    propertySideEffects,
                                    onError,
                                    () => {
                                        //
                                    },
                                ))
                            },
                            (range, beginData) => {
                                dictionarySideEffects = sideEffectsAPIs.map(s => {
                                    return s.onDictionaryOpen(propKey, range, beginData)
                                })
                            },
                            (endRange, endData, endContextData) => {
                                if (dictionarySideEffects === null) {
                                    throw new Error("UNEXPECTED")
                                }
                                dictionarySideEffects.forEach(s => {
                                    s.onDictionaryClose(endRange, endData)
                                })
                                if (hasEntries) {
                                    flagIsDirty()
                                }
                                doComments(endContextData, dictionary.endComments)

                            },
                        )
                    })
                }
                case "list": {
                    const $$ = $.type[1]
                    const list = nodeBuilder.getList(propKey)
                    let listSideEffects: null | sideEffects.List[] = null

                    let hasEntries = false
                    return context.expectValue(contextData => {
                        doComments(contextData, list.beginComments)
                        return context.expectList(
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
                                    return s.onListEntry()
                                })
                                return createNodeDeserializer(
                                    context,
                                    $$.node,
                                    null,
                                    entry.node,
                                    isCompact,
                                    null,
                                    elementSideEffects,
                                    onError,
                                    () => {
                                        //
                                    },
                                )
                            },
                            (beginRange, beginData) => {
                                listSideEffects = sideEffectsAPIs.map(s => {
                                    return s.onListOpen(propKey, beginRange, beginData)
                                })

                            },
                            (endRange, endData, endContextData) => {
                                if (hasEntries) {
                                    flagIsDirty()
                                }
                                if (listSideEffects === null) {
                                    throw new Error("UNEXPECTED")
                                }
                                listSideEffects.forEach(s => {
                                    s.onListClose(endRange, endData)
                                })
                                doComments(endContextData, list.endComments)

                            },
                        )
                    })
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = propDefinition.type[1]
            const componentBuilder = nodeBuilder.getComponent(propKey)
            return context.expectValue(createNodeDeserializer(
                context,
                $.type.get().node,
                null,
                componentBuilder.node,
                isCompact,
                null,
                sideEffectsAPIs.map(s => {
                    return s.onComponent(propKey)
                }),
                onError,
                flagIsDirty,
            )
            )
        }
        case "state group": {
            const $ = propDefinition.type[1]
            const stateGroup = nodeBuilder.getStateGroup(propKey)

            return context.expectValue(contextData => {
                doComments(contextData, stateGroup.comments)
                return context.expectTaggedUnion(
                    $.states.mapUnsorted((stateDef, stateName) => {
                        return (tuRange, optionRange, optionPreData) => {
                            const stateSideEffects = sideEffectsAPIs.map(s => {
                                return s.onState(
                                    propKey,
                                    stateName,
                                    tuRange,
                                    contextData,
                                    optionRange,
                                    optionPreData
                                )
                            })

                            const state = stateGroup.setState(stateName, errorMessage => onError(errorMessage, optionRange))
                            doComments(optionPreData, state.comments)


                            if ($["default state"].get() !== stateDef) {
                                flagIsDirty()
                            }
                            return context.expectValue(createNodeDeserializer(
                                context,
                                stateDef.node,
                                null,
                                state.node,
                                isCompact,
                                null,
                                stateSideEffects,
                                onError,
                                flagIsDirty
                            ))
                        }
                    }),
                    (option, tuData, optionData, optionPreData) => {
                        sideEffectsAPIs.forEach(s => {
                            s.onUnexpectedState(
                                option,
                                tuData,
                                contextData,
                                optionData,
                                optionPreData,
                                $,
                            )
                        })
                    },
                )
            })
        }
        case "value": {
            const $ = propDefinition.type[1]
            const valueBuilder = nodeBuilder.getValue(propKey)

            return context.expectValue(contextData => {
                doComments(contextData, valueBuilder.comments)
                return context.expectSimpleValue(
                    (range, data) => {
                        if (data.value !== $["default value"]) {
                            flagIsDirty()
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
                            s.onValue(propKey, valueBuilder, range, data, $)
                        })
                        return p.result(false)
                    },
                    () => {
                        //
                    }
                )
            })
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

function defaultInitializeNode(
    nodeDefinition: md.Node,
    nodeBuilder: syncAPI.Node,
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
    nodeBuilder: syncAPI.Node,
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

function createNodeDeserializer(
    context: bc.ExpectContext,
    nodeDefinition: md.Node,
    keyPropertyDefinition: md.Property | null,
    nodeBuilder: syncAPI.Node,
    isCompact: boolean,
    keyProperty: md.Property | null,
    sideEffectsAPI: sideEffects.Node[],
    onError: OnError,
    flagIsDirty: () => void,
): bc.OnValue {

    return contextData => {
        doComments(contextData, nodeBuilder.beginComments)
        if (isCompact) {
            flagIsDirty()
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
                        () => {
                            //
                        },
                    )
                })
            })
            doComments(contextData, nodeBuilder.beginComments)
            return context.expectArrayType(
                expectedElements,
                (startRange, startData) => {
                    sideEffectsAPI.forEach(s => {
                        s.onArrayTypeOpen(startRange, startData)
                    })

                },
                (endRange, endData, endContextData) => {
                    sideEffectsAPI.forEach(s => {
                        s.onArrayTypeClose(endRange, endData)
                    })
                    doComments(endContextData, nodeBuilder.endComments)

                }
            )
        } else {
            const processedProperties: {
                [key: string]: {
                    range: bc.Range
                    isDirty: boolean
                }
            } = {}
            const expectedProperties: bc.ExpectedProperties = {}
            nodeDefinition.properties.forEach((propDefinition, propKey) => {
                if (keyProperty === propDefinition) {
                    return
                }
                expectedProperties[propKey] = {
                    onExists: range => {
                        const processedProperty = {
                            range: range,
                            isDirty: false,
                        }
                        processedProperties[propKey] = processedProperty
                        sideEffectsAPI.forEach(s => {
                            s.onProperty(
                                propKey,
                                range,
                                propDefinition,
                                nodeBuilder,
                            )
                        })
                        return createPropertyDeserializer(
                            context,
                            propDefinition,
                            propKey,
                            nodeBuilder,
                            isCompact,
                            sideEffectsAPI,
                            onError,
                            () => {
                                processedProperty.isDirty = true
                            }
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
            doComments(contextData, nodeBuilder.beginComments)

            return context.expectType(
                expectedProperties,
                range => {
                    sideEffectsAPI.forEach(s => {
                        s.onTypeOpen(
                            range,
                            nodeDefinition,
                            keyPropertyDefinition,
                            nodeBuilder,
                        )
                    })
                },
                (_hasErrors, endRange) => {
                    let hasDirtyProperties = false
                    nodeDefinition.properties.forEach((_prop, propKey) => {
                        const processedProperty = processedProperties[propKey]
                        if (processedProperty !== undefined) {
                            if (!processedProperty.isDirty) {
                                onError(`property '${propKey}' has default value, remove`, processedProperty.range)
                            } else {
                                hasDirtyProperties = true
                            }
                        }
                    })
                    if (hasDirtyProperties) {
                        flagIsDirty()
                    }
                    sideEffectsAPI.forEach(s => {
                        s.onTypeClose(endRange)
                    })
                },
                (key, metaData) => {
                    sideEffectsAPI.forEach(s => {
                        s.onUnexpectedProperty(
                            key,
                            metaData,
                            contextData,
                            Object.keys(expectedProperties),
                        )
                    })
                    return bc.createDummyRequiredValueHandler()
                },
            )
        }
    }

}

export function createDatasetDeserializer(
    context: bc.ExpectContext,
    dataset: syncAPI.IDataset,
    isCompact: boolean,
    sideEffectsHandlers: sideEffects.Node[],
    onError: OnError,
): bc.RequiredValueHandler {
    return context.expectValue(createNodeDeserializer(
        context,
        dataset.schema["root type"].get().node,
        null,
        dataset.root, isCompact,
        null,
        sideEffectsHandlers,
        onError,
        () => {
            //
        },
    ))
}
