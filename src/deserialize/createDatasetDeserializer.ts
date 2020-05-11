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
    flagIsDirty: () => void,
): bc.RequiredValueHandler {
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectValue(context.expectDictionary(
                                (_key, propertyData) => {
                                    registerSnippetGenerators.onUnexpectedDictionaryEntry(
                                        propertyData,
                                    )
                                    return context.expectValue(context.expectNothing())
                                },
                                openData => {
                                    registerSnippetGenerators.onDictionaryOpen(openData)
                                },
                                endData => {
                                    registerSnippetGenerators.onDictionaryClose(endData)
                                },
                            ))
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            const collBuilder = nodeBuilder.getDictionary(propKey)
                            let hasEntries = false
                            return context.expectValue(context.expectDictionary(
                                (key, propertyData, preData) => {
                                    hasEntries = true
                                    const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                                    entry.node.getValue($$$["key property"].getName()).setValue(key, errorMessage => onError(errorMessage, propertyData.keyRange))
                                    entry.setComments(preData.comments.map(c => c.text))

                                    registerSnippetGenerators.onDictionaryEntry(
                                        propertyData,
                                        $$$.node,
                                        $$$["key property"].get(),
                                        entry
                                    )
                                    return context.expectValue(createNodeDeserializer(
                                        context,
                                        $$$.node,
                                        $$$["key property"].get(),
                                        entry.node,
                                        isCompact,
                                        $$$["key property"].get(),
                                        registerSnippetGenerators,
                                        onError,
                                        () => {
                                            //
                                        },
                                    ))
                                },
                                beginData => {
                                    registerSnippetGenerators.onDictionaryOpen(beginData)
                                },
                                endData => {
                                    registerSnippetGenerators.onDictionaryClose(endData)
                                    if (hasEntries) {
                                        flagIsDirty()
                                    }
                                },
                            ))
                        }
                        default:
                            return assertUnreachable($$["has instances"][0])
                    }
                }
                case "list": {
                    const $$ = $.type[1]

                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectValue(context.expectList(
                                () => {
                                    registerSnippetGenerators.onListEntry()
                                    return context.expectNothing()
                                },
                                beginData => {
                                    registerSnippetGenerators.onListOpen(beginData)
                                },
                                endData => {
                                    registerSnippetGenerators.onListClose(endData)
                                },
                            ))
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            const collBuilder = nodeBuilder.getList(propKey)
                            let hasEntries = false
                            return context.expectValue(context.expectList(
                                () => {
                                    hasEntries = true
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
                                        () => {
                                            //
                                        },
                                    )
                                },
                                beginData => {
                                    registerSnippetGenerators.onListOpen(beginData)
                                },
                                endData => {
                                    if (hasEntries) {
                                        flagIsDirty()
                                    }
                                    registerSnippetGenerators.onListClose(endData)
                                },
                            ))
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
            return context.expectValue(createNodeDeserializer(
                context,
                $.type.get().node,
                null,
                componentBuilder.node,
                isCompact,
                null,
                registerSnippetGenerators,
                onError,
                flagIsDirty,
            ))
        }
        case "state group": {
            const $ = propDefinition.type[1]
            return context.expectValue(context.expectTaggedUnion(
                $.states.mapUnsorted((stateDef, stateName) => {
                    return (tuData, tuPreData, optionData, optionPreData) => {
                        registerSnippetGenerators.onState(stateName, tuData, tuPreData, optionPreData)
                        const stateGroup = nodeBuilder.getStateGroup(propKey)
                        stateGroup.setComments(tuPreData.comments.map(c => c.text))
                        const state = stateGroup.setState(stateName, errorMessage => onError(errorMessage, optionData.range))
                        state.setComments(optionPreData.comments.map(c => c.text))
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
                            registerSnippetGenerators,
                            onError,
                            flagIsDirty
                        ))
                    }
                }),
                (option, tuData, beginPreData, optionData, optionPreData) => {
                    registerSnippetGenerators.onUnexpectedState(
                        option,
                        tuData,
                        beginPreData,
                        optionData,
                        optionPreData,
                        $,
                    )
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
                valueBuilder.setComments(preData.comments.map(c => c.text))
                registerSnippetGenerators.onValue(svData, valueBuilder)
            }))
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
                sideEffectsAPI.onArrayTypeOpen(startData)
            },
            endData => {
                sideEffectsAPI.onArrayTypeClose(endData)
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
                sideEffectsAPI.onTypeOpen(
                    openData.range,
                    nodeDefinition,
                    keyPropertyDefinition,
                    nodeBuilder,
                )
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
                sideEffectsAPI.onTypeClose(endData.range)
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
): bc.RequiredValueHandler {
    return context.expectValue(createNodeDeserializer(
        context,
        dataset.schema["root type"].get().node,
        null,
        dataset.root, isCompact,
        null,
        sideEffectsAPI,
        onError,
        () => {
            //
        },
    ))
}
