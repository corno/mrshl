import * as p from "pareto"
import * as astncore from "astn-core"
import * as buildAPI from "../../../interfaces/buildAPI"
import * as sideEffectAPI from "../../../interfaces/streamingValidationAPI"
import * as id from "../../interfaces/IDataset"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError<TokenAnnotation> = (message: string, annotation: TokenAnnotation) => void

function addComments<TokenAnnotation>(_target: buildAPI.Comments, _annotation: TokenAnnotation) {
    // contextData.before.comments.forEach(c => {
    //     target.addComment(c.text, c.type === "block" ? ["block"] : ["line"])
    // })
    // if (contextData.lineCommentAfter !== null) {
    //     target.addComment(contextData.lineCommentAfter.text, contextData.lineCommentAfter.type === "block" ? ["block"] : ["line"])
    // }
}

function createPropertyDeserializer<TokenAnnotation, NonTokenAnnotation>(
    context: astncore.IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    propDefinition: buildAPI.PropertyDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.PropertyHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    nullAllowed: boolean,
): astncore.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {

    function wrap(handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>) {
        return context.expectValue({
            handler: handler,
        })
    }
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    const dictionary = nodeBuilder.getDictionary(propKey)
                    let hasEntries = false
                    let dictionarySideEffects: null | sideEffectAPI.DictionaryHandler<TokenAnnotation>[] = null

                    return wrap(context.expectDictionary({
                        onBegin: data => {
                            addComments(dictionary.comments, data.annotation)

                            dictionarySideEffects = sideEffectsAPIs.map(s => {
                                return s.onDictionary({
                                    data: data.data,
                                    annotation: {
                                        annotation: data.annotation,
                                    },
                                })
                            })
                        },
                        onProperty: $ => {
                            hasEntries = true
                            const entry = dictionary.createEntry()
                            //const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                            entry.node.getValue($$["key property"].name).setValue($.data.key, errorMessage => onError(errorMessage, $.annotation))
                            addComments(entry.comments, $.annotation)


                            if (dictionarySideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            const propertySideEffects = dictionarySideEffects.map(s => {
                                return s.onEntry({
                                    data: $.data,
                                    annotation: {
                                        annotation: $.annotation,
                                        nodeDefinition: $$.node,
                                        keyProperty: $$["key property"].get(),
                                        entry: entry,
                                    },
                                })
                            })
                            return wrap(
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
                        onEnd: $ => {
                            if (dictionarySideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            dictionarySideEffects.forEach(s => {
                                s.onClose({

                                    annotation: {
                                        annotation: $.annotation,
                                    },
                                })
                            })
                            if (hasEntries) {
                                flagNonDefaultPropertiesFound()
                            }
                            addComments(dictionary.comments, $.annotation)

                        },
                    }))
                }
                case "list": {
                    const $$ = $.type[1]
                    const list = nodeBuilder.getList(propKey)
                    let listSideEffects: null | sideEffectAPI.ListHandler<TokenAnnotation>[] = null

                    let hasEntries = false
                    return wrap(context.expectList({
                        onBegin: data => {
                            addComments(list.comments, data.annotation)

                            listSideEffects = sideEffectsAPIs.map(s => {
                                return s.onList({
                                    data: data.data,
                                    annotation: {
                                        annotation: data.annotation,
                                    },
                                })
                            })

                        },
                        onElement: () => {
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
                        onEnd: $ => {
                            if (hasEntries) {
                                flagNonDefaultPropertiesFound()
                            }
                            if (listSideEffects === null) {
                                throw new Error("UNEXPECTED")
                            }
                            listSideEffects.forEach(s => {
                                s.onClose({
                                    annotation: {
                                        annotation: $.annotation,
                                    },
                                })
                            })
                            addComments(list.comments, $.annotation)

                        },
                    }))
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = propDefinition.type[1]
            const componentBuilder = nodeBuilder.getComponent(propKey)
            return wrap(
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
            return wrap(context.expectTaggedUnion({
                options: $.states.mapSorted((stateDef, stateName) => {
                    return (tuData, optionData) => {
                        const stateSideEffects = sideEffectsAPIs.map(s => {
                            return s.onStateGroup({
                                annotation: {
                                    annotation: tuData.annotation,
                                },
                            }).onOption({
                                data: optionData.data,
                                annotation: {
                                    annotation: optionData.annotation,
                                },
                            })
                        })


                        addComments(stateGroup.comments, tuData.annotation)
                        const state = stateGroup.setState(stateName, errorMessage => onError(errorMessage, optionData.annotation))
                        addComments(stateGroup.comments, optionData.annotation)
                        if ($["default state"].get() !== stateDef) {
                            flagNonDefaultPropertiesFound()
                        }
                        return wrap(
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
                onUnexpectedOption: $$ => {
                    sideEffectsAPIs.forEach(s => {
                        s.onStateGroup({
                            annotation: {
                                annotation: $$.tuAnnotation,
                            },
                        }).onOption({
                            data: $$.data,
                            annotation: {
                                annotation: $$.optionAnnotation,
                                //stateGroupDefinition: $,
                            },
                        })
                    })
                },
                onNull: data => { //onNull
                    sideEffectsAPIs.map(s => {
                        return s.onNull({
                            data: data.data,
                            annotation: {
                                annotation: data.annotation,
                            },
                        })
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
            }))
        }
        case "value": {
            const $ = propDefinition.type[1]
            const valueBuilder = nodeBuilder.getValue(propKey)

            return wrap(context.expectString({
                callback: $$ => {
                    addComments(valueBuilder.comments, $$.annotation)

                    switch ($$.data.type[0]) {
                        case "multiline": {
                            //const $ = $$.data.type[1]

                            throw new Error("IMPLEMENT MULTILINE")
                        }
                        case "nonwrapped": {
                            const $$$ = $$.data.type[1]

                            if ($$$.value !== $["default value"]) {
                                flagNonDefaultPropertiesFound()
                            }
                            valueBuilder.setValue($$$.value, errorMessage => onError(errorMessage, $$.annotation))
                            if ($.quoted) {
                                onError(`value '${$$$.value}' must be quoted`, $$.annotation)
                            }
                            sideEffectsAPIs.forEach(s => {
                                s.onScalarValue({
                                    value: $$$.value,
                                    data: $$.data,
                                    annotation: {
                                        definition: $,
                                        syncValue: valueBuilder,
                                        annotation: $$.annotation,
                                        //  valueBuilder:   valueBuilder,
                                        //     $
                                    },
                                })
                            })
                            break
                        }
                        case "quoted": {
                            const $$$ = $$.data.type[1]

                            if ($$$.value !== $["default value"]) {
                                flagNonDefaultPropertiesFound()
                            }
                            valueBuilder.setValue($$$.value, errorMessage => onError(errorMessage, $$.annotation))
                            if (!$.quoted) {
                                onError(`value '${$$$.value}' must be unquoted`, $$.annotation)
                            }
                            sideEffectsAPIs.forEach(s => {
                                s.onScalarValue({
                                    value: $$$.value,
                                    data: $$.data,
                                    annotation: {
                                        definition: $,

                                        syncValue: valueBuilder,
                                        annotation: $$.annotation,
                                        //  valueBuilder:   valueBuilder,
                                        //     $
                                    },
                                })
                            })
                            break
                        }
                        default:
                            assertUnreachable($$.data.type[0])
                    }
                    return p.value(false)
                },
                onInvalidType: $ => {
                    onError(`expected a simple value`, $.annotation)
                },
                onNull: $ => { //onNull
                    sideEffectsAPIs.map(s => {
                        return s.onNull({
                            data: $.data,
                            annotation: {
                                annotation: $.annotation,
                            },
                        })
                    })
                    defaultInitializeProperty(
                        $.annotation,
                        propDefinition,
                        propKey,
                        nodeBuilder,
                        onError
                    )
                    if (!nullAllowed) {
                        onError(`value may not be null`, $.annotation)
                    }
                    return p.value(false)
                },
            }))
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

function defaultInitializeNode<TokenAnnotation>(
    annotation: TokenAnnotation,
    nodeDefinition: buildAPI.NodeDefinition,
    nodeBuilder: buildAPI.Node,
    onError: OnError<TokenAnnotation>,
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


function defaultInitializeProperty<TokenAnnotation>(
    annotation: TokenAnnotation,
    propDefinition: buildAPI.PropertyDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    onError: OnError<TokenAnnotation>,
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

function getPropertyComments(node: buildAPI.Node, propertyName: string, propertyDefinition: buildAPI.PropertyDefinition): buildAPI.Comments {
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

function createNodeDeserializer<TokenAnnotation, NonTokenAnnotation>(
    context: astncore.IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    nodeDefinition: buildAPI.NodeDefinition,
    keyPropertyDefinition: buildAPI.PropertyDefinition | null,
    nodeBuilder: buildAPI.Node,
    keyProperty: buildAPI.PropertyDefinition | null,
    sideEffectsAPI: sideEffectAPI.NodeHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: buildAPI.Comments,
): astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation> {


    let shorthandTypeSideEffects: sideEffectAPI.ShorthandTypeHandler<TokenAnnotation>[] | null = null
    let typeSideEffects: sideEffectAPI.TypeHandler<TokenAnnotation>[] | null = null

    const expectedElements: astncore.ExpectedElements<TokenAnnotation, NonTokenAnnotation> = []
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
                        return s.onProperty({
                            annotation: {
                                propKey: propKey,
                                propDefinition: propDefinition,
                                nodeBuilder: nodeBuilder,
                            },
                        })
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
            annotation: TokenAnnotation
            isNonDefault: boolean
        }
    } = {}
    const expectedProperties: astncore.ExpectedProperties<TokenAnnotation, NonTokenAnnotation> = {}
    nodeDefinition.properties.forEach((propDefinition, propKey) => {
        if (keyProperty === propDefinition) {
            return
        }
        expectedProperties[propKey] = {
            onExists: $ => {
                addComments(getPropertyComments(nodeBuilder, propKey, propDefinition), $.annotation)
                const processedProperty = {
                    annotation: $.annotation,
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
                        return s.onProperty({
                            data: $.data,
                            annotation: {
                                nodeDefinition: nodeDefinition,
                                key: propKey,
                                nodeBuilder: nodeBuilder,
                                annotation: $.annotation,
                            },
                        })
                    }),
                    onError,
                    () => {
                        processedProperty.isNonDefault = true
                    },
                    false,
                )
            },
            onNotExists: $ => {
                defaultInitializeProperty(
                    $.beginAnnotation,
                    propDefinition,
                    propKey,
                    nodeBuilder,
                    onError,
                )
            },
        }
    })

    return context.expectTypeOrShorthandType({
        properties: expectedProperties,
        elements: expectedElements,
        onTypeBegin: $ => { //onTypeBegin
            addComments(targetComments, $.annotation)

            typeSideEffects = sideEffectsAPI.map(s => {
                return s.onTypeOpen({
                    data: $.data,
                    annotation: {
                        annotation: $.annotation,
                        nodeDefinition: nodeDefinition,
                        keyPropertyDefinition: keyPropertyDefinition,
                        nodeBuilder: nodeBuilder,
                    },
                })
            })
        },
        onTypeEnd: $ => { //onTypeEnd
            let hadNonDefaultProperties = false
            addComments(targetComments, $.annotation)
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
                s.onTypeClose({
                    annotation: {
                        annotation: $.annotation,
                    },
                })
            })
        },
        onUnexpectedProperty: $ => { //onUnexpectedProperty
            if (typeSideEffects === null) {
                throw new Error("missing type side effects")
            }
            typeSideEffects.forEach(s => {
                s.onProperty({
                    data: $.data,
                    annotation: {
                        nodeDefinition: nodeDefinition,
                        key: $.data.key,
                        nodeBuilder: nodeBuilder,
                        annotation: $.annotation,
                        //expectedProperties: Object.keys(expectedProperties),
                    },
                })
            })
            return astncore.createDummyRequiredValueHandler()
        },
        onShorthandTypeBegin: $ => { //shorthand open
            shorthandTypeSideEffects = sideEffectsAPI.map(s => {
                return s.onShorthandTypeOpen({
                    data: $.data,
                    annotation: {
                        annotation: $.annotation,
                        nodeDefinition: nodeDefinition,
                        keyPropertyDefinition: keyPropertyDefinition,
                        nodeBuilder: nodeBuilder,
                    },
                })
            })

        },
        onShorthandTypeEnd: $ => { //shorthand close
            if (shorthandTypeSideEffects === null) {
                throw new Error("unexpected: no shorthand type side effect handlers")
            }
            shorthandTypeSideEffects.forEach(s => {
                s.onShorthandTypeClose({
                    annotation: {
                        annotation: $.annotation,
                    },
                })
            })
            addComments(targetComments, $.annotation)
        },
    })

}

export function createDatasetDeserializer<TokenAnnotation, NonTokenAnnotation>(
    context: astncore.IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    dataset: id.IDataset,
    sideEffectsHandlers: sideEffectAPI.NodeHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
): astncore.TreeHandler<TokenAnnotation, NonTokenAnnotation> {

    function wrap(handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>) {
        return context.expectValue({
            handler: handler,
        })
    }
    return {
        root: wrap(
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
        ),
    }
}
