import * as p from "pareto"
import * as astn from "astn"
import * as md from "../../API/types"
import * as syncAPI from "../../API/syncAPI"
import * as id from "../../API/IDataset"
import * as sideEffects from "../../API/ParsingSideEffectsAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError<Annotation> = (message: string, annotation: Annotation) => void

function addComments<Annotation>(_target: syncAPI.Comments, _annotation: Annotation) {
    // contextData.before.comments.forEach(c => {
    //     target.addComment(c.text, c.type === "block" ? ["block"] : ["line"])
    // })
    // if (contextData.lineCommentAfter !== null) {
    //     target.addComment(contextData.lineCommentAfter.text, contextData.lineCommentAfter.type === "block" ? ["block"] : ["line"])
    // }
}

function createPropertyDeserializer<Annotation>(
    context: astn.ExpectContext<Annotation>,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: syncAPI.Node,
    sideEffectsAPIs: sideEffects.Property<Annotation>[],
    onError: OnError<Annotation>,
    flagNonDefaultPropertiesFound: () => void,
    nullAllowed: boolean,
): astn.RequiredValueHandler<Annotation> {
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    const dictionary = nodeBuilder.getDictionary(propKey)
                    let hasEntries = false
                    let dictionarySideEffects: null | sideEffects.Dictionary<Annotation>[] = null


                    return context.expectValue(context.expectDictionary(
                        data => {
                            addComments(dictionary.comments, data.annotation)

                            dictionarySideEffects = sideEffectsAPIs.map(s => {
                                return s.onDictionary(data)
                            })
                        },
                        propertyData => {
                            hasEntries = true
                            const entry = dictionary.createEntry()
                            //const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                            entry.node.getValue($$["key property"].name).setValue(propertyData.key, errorMessage => onError(errorMessage, propertyData.annotation))
                            addComments(entry.comments, propertyData.annotation)


                            if (dictionarySideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            const propertySideEffects = dictionarySideEffects.map(s => {
                                return s.onEntry(
                                    propertyData,
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
                        endData => {
                            if (dictionarySideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            dictionarySideEffects.forEach(s => {
                                s.onClose(endData)
                            })
                            if (hasEntries) {
                                flagNonDefaultPropertiesFound()
                            }
                            addComments(dictionary.comments, endData.annotation)

                        },
                        null,
                    ))
                }
                case "list": {
                    const $$ = $.type[1]
                    const list = nodeBuilder.getList(propKey)
                    let listSideEffects: null | sideEffects.List<Annotation>[] = null

                    let hasEntries = false
                    return context.expectValue(context.expectList(
                        data => {
                            addComments(list.comments, data.annotation)

                            listSideEffects = sideEffectsAPIs.map(s => {
                                return s.onList(data)
                            })

                        },
                        () => {
                            hasEntries = true
                            const entry = list.createEntry()
                            // const entry = collBuilder.createEntry(_errorMessage => {
                            //     //onError(errorMessage, svData)
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
                        endData => {
                            if (hasEntries) {
                                flagNonDefaultPropertiesFound()
                            }
                            if (listSideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            listSideEffects.forEach(s => {
                                s.onClose(endData)
                            })
                            addComments(list.comments, endData.annotation)

                        },
                        undefined,
                    ))
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
            return context.expectValue(context.expectTaggedUnion(
                $.states.mapSorted((stateDef, stateName) => {
                    return (tuData, optionData) => {
                        addComments(stateGroup.comments, tuData.annotation)
                        const stateSideEffects = sideEffectsAPIs.map(s => {
                            return s.onStateGroup(tuData).onState(optionData)
                        })

                        const state = stateGroup.setState(stateName, errorMessage => onError(errorMessage, optionData.annotation))
                        addComments(stateGroup.comments, optionData.annotation)


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
                (tuData, optionData) => {
                    sideEffectsAPIs.forEach(s => {
                        s.onStateGroup(tuData).onUnexpectedState(optionData, $)
                    })
                },
                undefined, //onMissingOption
                undefined, // onInvalidType
                data => { //onNull
                    sideEffectsAPIs.map(s => {
                        return s.onNull(data)
                    })
                    defaultInitializeProperty(
                        data.annotation,
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        onError
                    )
                    if (!nullAllowed) {
                        onError(`value may not be null`, data.annotation)
                    }

                    return p.value(false)
                },
            ))
        }
        case "value": {
            const $ = propDefinition.type[1]
            const valueBuilder = nodeBuilder.getValue(propKey)

            return context.expectValue(context.expectSimpleValue(
                data => {
                    addComments(valueBuilder.comments, data.annotation)

                    if (data.value !== $["default value"]) {
                        flagNonDefaultPropertiesFound()
                    }
                    valueBuilder.setValue(data.value, errorMessage => onError(errorMessage, data.annotation))
                    if (data.wrapper[0] !== "none") {
                        if (!$.quoted) {
                            onError(`value '${data.value}' must be unquoted`, data.annotation)
                        }
                    } else {
                        if ($.quoted) {
                            onError(`value '${data.value}' must be quoted`, data.annotation)
                        }

                    }
                    //valueBuilder.setValue(value, svData.quote !== null, svData, comments)


                    sideEffectsAPIs.forEach(s => {
                        s.onValue(data, valueBuilder, $)
                    })
                    return p.value(false)
                },
                range => {
                    onError(`expected a simple value`, range)
                },
                data => { //onNull
                    sideEffectsAPIs.map(s => {
                        return s.onNull(data)
                    })
                    defaultInitializeProperty(
                        data.annotation,
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        onError
                    )
                    if (!nullAllowed) {
                        onError(`value may not be null`, data.annotation)
                    }
                    return p.value(false)
                },
            )
            )
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

function defaultInitializeNode<Annotation>(
    annotation: Annotation,
    nodeDefinition: md.Node,
    nodeBuilder: syncAPI.Node,
    onError: OnError<Annotation>,
) {
    nodeDefinition.properties.forEach((propDef, propKey) => {
        defaultInitializeProperty(
            annotation,
            propDef,
            propKey,
            nodeBuilder,
            onError,
        )
    })
}


function defaultInitializeProperty<Annotation>(
    annotation: Annotation,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: syncAPI.Node,
    onError: OnError<Annotation>,
) {

    switch (propDefinition.type[0]) {
        case "collection": {
            //nothing to do
            break
        }
        case "component": {
            const $ = propDefinition.type[1]
            defaultInitializeNode(
                annotation,
                $.type.get().node,
                nodeBuilder.getComponent(propKey).node,
                onError,
            )
            break
        }
        case "state group": {
            const $ = propDefinition.type[1]
            nodeBuilder.getStateGroup(propKey).setState($["default state"].name, errorMessage => onError(errorMessage, annotation))
            break
        }
        case "value": {
            const $ = propDefinition.type[1]
            nodeBuilder.getValue(propKey).setValue($["default value"], errorMessage => onError(errorMessage, annotation))
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

function createNodeDeserializer<Annotation>(
    context: astn.ExpectContext<Annotation>,
    nodeDefinition: md.Node,
    keyPropertyDefinition: md.Property | null,
    nodeBuilder: syncAPI.Node,
    keyProperty: md.Property | null,
    sideEffectsAPI: sideEffects.Node<Annotation>[],
    onError: OnError<Annotation>,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: syncAPI.Comments,
): astn.ValueHandler<Annotation> {


    let shorthandTypeSideEffects: sideEffects.ShorthandType<Annotation>[] | null = null
    let typeSideEffects: sideEffects.Type<Annotation>[] | null = null

    const expectedElements: astn.ExpectedElements<Annotation> = []
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
                    true,
                )
            },
        })
    })

    const processedProperties: {
        [key: string]: {
            annotation: Annotation
            isNonDefault: boolean
        }
    } = {}
    const expectedProperties: astn.ExpectedProperties<Annotation> = {}
    nodeDefinition.properties.forEach((propDefinition, propKey) => {
        if (keyProperty === propDefinition) {
            return
        }
        expectedProperties[propKey] = {
            onExists: data => {
                addComments(getPropertyComments(nodeBuilder, propKey, propDefinition), data.annotation)
                const processedProperty = {
                    annotation: data.annotation,
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
                            data,
                            propDefinition,
                            nodeBuilder,
                        )
                    }),
                    onError,
                    () => {
                        processedProperty.isNonDefault = true
                    },
                    false,
                )
            },
            onNotExists: data => {
                defaultInitializeProperty(
                    data.annotation,
                    propDefinition,
                    propKey,
                    nodeBuilder,
                    onError,
                )
            },
        }
    })

    return context.expectTypeOrShorthandType(
        expectedProperties,
        expectedElements,
        data => { //onTypeBegin
            addComments(targetComments, data.annotation)

            typeSideEffects = sideEffectsAPI.map(s => {
                return s.onTypeOpen(
                    data,
                    nodeDefinition,
                    keyPropertyDefinition,
                    nodeBuilder,
                )
            })
        },
        (_hasErrors, data) => { //onTypeEnd
            let hadNonDefaultProperties = false
            addComments(targetComments, data.annotation)
            nodeDefinition.properties.forEach((_prop, propKey) => {
                const processedProperty = processedProperties[propKey]
                if (processedProperty !== undefined) {
                    if (!processedProperty.isNonDefault) {
                        onError(`property '${propKey}' has default value, remove`, processedProperty.annotation)
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
                s.onTypeClose(data)
            })
        },
        data => { //onUnexpectedProperty
            if (typeSideEffects === null) {
                throw new Error("missing type side effects")
            }
            typeSideEffects.forEach(s => {
                s.onUnexpectedProperty(
                    data,
                    Object.keys(expectedProperties),
                )
            })
            return astn.createDummyRequiredValueHandler()
        },
        data => { //shorthand open
            shorthandTypeSideEffects = sideEffectsAPI.map(s => {
                return s.onShorthandTypeOpen(
                    data,
                    nodeDefinition,
                    keyPropertyDefinition,
                    nodeBuilder,
                )
            })

        },
        shortHandEndData => { //shorthand close
            if (shorthandTypeSideEffects === null) {
                throw new Error("unexpected: no shorthand type side effect handlers")
            }
            shorthandTypeSideEffects.forEach(s => {
                s.onShorthandTypeClose(shortHandEndData)
            })
            addComments(targetComments, shortHandEndData.annotation)
        },
        () => { //onInvalidType

        },
    )

}

export function createDatasetDeserializer<Annotation>(
    context: astn.ExpectContext<Annotation>,
    dataset: id.IDataset,
    sideEffectsHandlers: sideEffects.Node<Annotation>[],
    onError: OnError<Annotation>,
): astn.RequiredValueHandler<Annotation> {
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
