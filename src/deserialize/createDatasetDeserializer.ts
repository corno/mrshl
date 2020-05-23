import * as bc from "bass-clarinet-typed"
import * as md from "../metaDataSchema"
import * as ds from "../syncAPI"
import * as sideEffects from "../SideEffectsAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError = (message: string, range: bc.Range) => void

function createPropertyDeserializer(
    context: bc.ExpectContext,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: ds.Node,
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
                    const collBuilder = nodeBuilder.getDictionary(propKey)
                    let hasEntries = false
                    let dictionarySideEffects: null | sideEffects.Dictionary[] = null
                    return context.expectValue(context.expectDictionary(
                        (key, propertyData, preData) => {
                            hasEntries = true
                            const entry = collBuilder.createEntry()
                            //const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                            entry.node.getValue($$["key property"].name).setValue(key, errorMessage => onError(errorMessage, propertyData.keyRange))
                            entry.comments.setComments(preData.comments.map(c => c.text))

                            if (dictionarySideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            const propertySideEffects = dictionarySideEffects.map(s => {
                                return s.onDictionaryEntry(
                                    propertyData,
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
                        beginData => {
                            dictionarySideEffects = sideEffectsAPIs.map(s => {
                                return s.onDictionaryOpen(propKey, beginData)
                            })
                        },
                        endData => {
                            if (dictionarySideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            dictionarySideEffects.forEach(s => {
                                s.onDictionaryClose(endData)
                            })
                            if (hasEntries) {
                                flagIsDirty()
                            }
                        },
                    ))
                }
                case "list": {
                    const $$ = $.type[1]
                    const collBuilder = nodeBuilder.getList(propKey)
                    let listSideEffects: null | sideEffects.List[] = null

                    let hasEntries = false
                    return context.expectValue(context.expectList(
                        () => {
                            hasEntries = true
                            const entry = collBuilder.createEntry()
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
                        beginData => {
                            listSideEffects = sideEffectsAPIs.map(s => {
                                return s.onListOpen(propKey, beginData)
                            })
                        },
                        endData => {
                            if (hasEntries) {
                                flagIsDirty()
                            }
                            if (listSideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            listSideEffects.forEach(s => {
                                s.onListClose(endData)
                            })
                        },
                    ))
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
            ))
        }
        case "state group": {
            const $ = propDefinition.type[1]
            return context.expectValue(context.expectTaggedUnion(
                $.states.mapUnsorted((stateDef, stateName) => {
                    return (tuData, tuPreData, optionData, optionPreData) => {
                        const stateSideEffects = sideEffectsAPIs.map(s => {
                            return s.onState(
                                propKey,
                                stateName,
                                tuData,
                                tuPreData,
                                optionPreData
                            )
                        })
                        const stateGroup = nodeBuilder.getStateGroup(propKey)
                        stateGroup.comments.setComments(tuPreData.comments.map(c => c.text))
                        const state = stateGroup.setState(stateName, errorMessage => onError(errorMessage, optionData.range))
                        state.comments.setComments(optionPreData.comments.map(c => c.text))
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
                (option, tuData, beginPreData, optionData, optionPreData) => {
                    sideEffectsAPIs.forEach(s => {
                        s.onUnexpectedState(
                            option,
                            tuData,
                            beginPreData,
                            optionData,
                            optionPreData,
                            $,
                        )
                    })
                },
            ))
        }
        case "value": {
            const $ = propDefinition.type[1]
            return context.expectValue(context.expectSimpleValue((value, svData, preData) => {
                const valueBuilder = nodeBuilder.getValue(propKey)
                if (value !== $["default value"]) {
                    flagIsDirty()
                }
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
                valueBuilder.comments.setComments(preData.comments.map(c => c.text))
                sideEffectsAPIs.forEach(s => {
                    s.onValue(propKey, svData, valueBuilder, $)
                })
            }))
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}


function defaultInitializeNode(
    nodeDefinition: md.Node,
    nodeBuilder: ds.Node,
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
    nodeBuilder: ds.Node,
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
    nodeBuilder: ds.Node,
    isCompact: boolean,
    keyProperty: md.Property | null,
    sideEffectsAPI: sideEffects.Node[],
    onError: OnError,
    flagIsDirty: () => void,
): bc.ValueHandler {
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
        return context.expectArrayType(
            expectedElements,
            startData => {
                sideEffectsAPI.forEach(s => {
                    s.onArrayTypeOpen(startData)
                })
            },
            endData => {
                sideEffectsAPI.forEach(s => {
                    s.onArrayTypeClose(endData)
                })
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
                onExists: propertyData => {
                    const processedProperty = {
                        range: propertyData.keyRange,
                        isDirty: false,
                    }
                    processedProperties[propKey] = processedProperty
                    sideEffectsAPI.forEach(s => {
                        s.onProperty(
                            propertyData,
                            propKey,
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
                onNotExists: beginData => {
                    defaultInitializeProperty(
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        beginData.range,
                        onError,
                    )
                },
            }
        })
        return context.expectType(
            expectedProperties,
            openData => {
                sideEffectsAPI.forEach(s => {
                    s.onTypeOpen(
                        openData.range,
                        nodeDefinition,
                        keyPropertyDefinition,
                        nodeBuilder,
                    )
                })
            },
            (_hasErrors, endData) => {
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
                    s.onTypeClose(endData.range)
                })
            },
            (key, metaData, preData) => {
                sideEffectsAPI.forEach(s => {
                    s.onUnexpectedProperty(
                        key,
                        metaData,
                        preData,
                        Object.keys(expectedProperties),
                    )
                })
            },
        )
    }

}

export function createDatasetDeserializer(
    context: bc.ExpectContext,
    dataset: ds.IDataset,
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
