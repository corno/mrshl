import * as p from "pareto"
import * as astncore from "astn-core"
import * as buildAPI from "../../../interfaces/buildAPI"
import * as def from "../../../interfaces/typedParserDefinitions"
import * as sideEffectAPI from "../../../interfaces/streamingValidationAPI"
import * as id from "../../../interfaces/buildAPI/IDataset"
import { DiagnosticSeverity } from "../../../interfaces/DiagnosticSeverity"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError<TokenAnnotation> = (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void

function wrap<TokenAnnotation, NonTokenAnnotation>(
    handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>
) {
    return {
        exists: handler,
        missing: (): void => {
            //onerror("missing",)
        },
    }
}

function addComments<TokenAnnotation>(_target: buildAPI.Comments, _annotation: TokenAnnotation) {
    // contextData.before.comments.forEach(c => {
    //     target.addComment(c.text, c.type === "block" ? ["block"] : ["line"])
    // })
    // if (contextData.lineCommentAfter !== null) {
    //     target.addComment(contextData.lineCommentAfter.text, contextData.lineCommentAfter.type === "block" ? ["block"] : ["line"])
    // }
}

function createUnexpectedArrayHandler<TokenAnnotation, NonTokenAnnotation>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
): astncore.ArrayHandler<TokenAnnotation, NonTokenAnnotation> {
    onError(message, annotation, DiagnosticSeverity.error)

    return {
        element: () => {
            return astncore.createDummyValueHandler()
        },
        arrayEnd: () => {
            return p.value(null)
        },
    }
}

function createUnexpectedObjectHandler<TokenAnnotation, NonTokenAnnotation>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>
): astncore.ObjectHandler<TokenAnnotation, NonTokenAnnotation> {
    onError(message, annotation, DiagnosticSeverity.error)

    return {
        property: () => {
            return p.value(astncore.createDummyRequiredValueHandler())
        },
        objectEnd: () => {
            return p.value(null)
        },
    }
}

function createUnexpectedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
): astncore.TaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
    onError(message, annotation, DiagnosticSeverity.error)

    return {
        option: () => {
            return astncore.createDummyRequiredValueHandler()
        },
        missingOption: () => {
            //
        },
        end: () => {
            //
        },
    }
}

function createUnexpectedStringHandler<TokenAnnotation>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
): p.IValue<boolean> {
    onError(message, annotation, DiagnosticSeverity.error)
    return p.value(false)
}

function createPropertyDeserializer<TokenAnnotation, NonTokenAnnotation>(
    propDefinition: def.PropertyDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.PropertyHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
): astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation> {

    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    const dictionary = nodeBuilder.getDictionary(propKey)


                    return {
                        array: $ => {
                            return createUnexpectedArrayHandler(`expected a dictionary`, $.annotation, onError)
                        },
                        object: $ => {

                            const foundKeys: string[] = []
                            if ($.data.type[0] !== "dictionary") {
                                onError("expected a dictionary: { }", $.annotation, DiagnosticSeverity.warning)
                            }
                            addComments(dictionary.comments, $.annotation)

                            const dictionarySideEffects = sideEffectsAPIs.map(s => {
                                return s.onDictionary({
                                    data: $.data,
                                    annotation: {
                                        annotation: $.annotation,
                                    },
                                })
                            })
                            return {
                                property: $ => {

                                    if (foundKeys.includes($.data.key)) {
                                        onError("double key", $.annotation, DiagnosticSeverity.error)
                                    }
                                    foundKeys.push($.data.key)
                                    const entry = dictionary.createEntry()
                                    //const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                                    entry.node.getValue($$["key property"].name).setValue($.data.key, errorMessage => onError(errorMessage, $.annotation, DiagnosticSeverity.error))
                                    addComments(entry.comments, $.annotation)


                                    const propertySideEffects = dictionarySideEffects.map(s => {
                                        return s.onEntry({
                                            data: $.data,
                                            annotation: {
                                                annotation: $.annotation,
                                                nodeDefinition: $$.node,
                                                keyProperty: $$["key property"].get(),
                                            },
                                        })
                                    })
                                    return p.value(wrap(
                                        createNodeDeserializer(
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
                                    ))
                                },
                                objectEnd: $ => {

                                    dictionarySideEffects.forEach(s => {
                                        s.onClose({
                                            annotation: {
                                                annotation: $.annotation,
                                            },
                                        })
                                    })
                                    if (foundKeys.length !== 0) {
                                        flagNonDefaultPropertiesFound()
                                    }
                                    addComments(dictionary.comments, $.annotation)
                                    return p.value(null)

                                },
                            }
                        },
                        taggedUnion: $ => {
                            return createUnexpectedTaggedUnionHandler(`expected a dictionary`, $.annotation, onError)
                        },
                        string: $ => {
                            return createUnexpectedStringHandler(`expected a dictionary`, $.annotation, onError)
                        },
                    }

                }
                case "list": {
                    const $$ = $.type[1]
                    const list = nodeBuilder.getList(propKey)

                    let hasEntries = false
                    return {
                        array: $ => {
                            if ($.data.type[0] !== "list") {
                                onError("not a list", $.annotation, DiagnosticSeverity.error)
                            }
                            addComments(list.comments, $.annotation)
                            const listSideEffects = sideEffectsAPIs.map(s => {
                                return s.onList({
                                    data: $.data,
                                    annotation: {
                                        annotation: $.annotation,
                                    },
                                })
                            })
                            return {
                                element: () => {
                                    hasEntries = true
                                    const entry = list.createEntry()
                                    // const entry = collBuilder.createEntry(_errorMessage => {
                                    //     //onError(errorMessage, svData)
                                    // })
                                    const elementSideEffects = listSideEffects.map(s => {
                                        return s.onEntry()
                                    })
                                    return createNodeDeserializer(
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
                                arrayEnd: $ => {
                                    if (hasEntries) {
                                        flagNonDefaultPropertiesFound()
                                    }
                                    listSideEffects.forEach(s => {
                                        s.onClose({
                                            annotation: {
                                                annotation: $.annotation,
                                            },
                                        })
                                    })
                                    addComments(list.comments, $.annotation)
                                    return p.value(null)
                                },
                            }
                        },
                        object: $ => {
                            return createUnexpectedObjectHandler(`expected a list`, $.annotation, onError)
                        },
                        taggedUnion: $ => {
                            return createUnexpectedTaggedUnionHandler(`expected a list`, $.annotation, onError)
                        },
                        string: $ => {
                            return createUnexpectedStringHandler(`expected a list`, $.annotation, onError)

                        },
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
            )
        }
        case "tagged union": {
            const $ = propDefinition.type[1]
            const stateGroup = nodeBuilder.getTaggedUnion(propKey)

            return {
                array: $ => {
                    return createUnexpectedArrayHandler(`expected a tagged union`, $.annotation, onError)
                },
                object: $ => {
                    return createUnexpectedObjectHandler(`expected a tagged union`, $.annotation, onError)
                },
                taggedUnion: $$ => {
                    const sgse = sideEffectsAPIs.map(s => {
                        return s.onTaggedUnion({
                            annotation: {
                                annotation: $$.annotation,
                            },
                        })
                    })
                    addComments(stateGroup.comments, $$.annotation)

                    return {
                        option: $$$ => {
                            const optionName = $$$.data.option
                            const option = $.options.get($$$.data.option)
                            if (option === null) {
                                onError(`unknown option: '${optionName}'`, $$$.annotation, DiagnosticSeverity.error)
                                sgse.forEach(s => {
                                    return s.onUnexpectedOption({
                                        data: $$$.data,
                                        annotation: {
                                            annotation: $$$.annotation,
                                            //stateGroupDefinition: $,
                                        },
                                    })
                                })
                                return astncore.createDummyRequiredValueHandler()
                            } else {

                                const sse = sgse.map(s => {
                                    return s.onOption({
                                        data: $$$.data,
                                        annotation: {
                                            annotation: $$$.annotation,
                                            definition: option,
                                            //stateGroupDefinition: $,
                                        },
                                    })
                                })
                                const state = stateGroup.setState(optionName, errorMessage => onError(errorMessage, $$$.annotation, DiagnosticSeverity.error))
                                addComments(stateGroup.comments, $$$.annotation)
                                if ($["default option"].get() !== option) {
                                    flagNonDefaultPropertiesFound()
                                }
                                return wrap(
                                    createNodeDeserializer(
                                        option.node,
                                        null,
                                        state.node,
                                        null,
                                        sse,
                                        onError,
                                        flagNonDefaultPropertiesFound,
                                        stateGroup.comments,
                                    ),
                                )
                            }
                        },
                        missingOption: () => {
                            onError("missing option", $$.annotation, DiagnosticSeverity.error)
                        },
                        end: () => {
                            //
                        },
                    }
                },
                string: $ => {
                    return createUnexpectedStringHandler(`expected a tagged union`, $.annotation, onError)

                },
            }
        }
        case "string": {
            const $ = propDefinition.type[1]
            const valueBuilder = nodeBuilder.getValue(propKey)

            return {
                array: $ => {
                    return createUnexpectedArrayHandler(`expected a string`, $.annotation, onError)
                },
                object: $ => {
                    return createUnexpectedObjectHandler(`expected a string`, $.annotation, onError)
                },
                taggedUnion: $ => {
                    return createUnexpectedTaggedUnionHandler(`expected a string`, $.annotation, onError)
                },
                string: $$ => {
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
                            valueBuilder.setValue($$$.value, errorMessage => onError(errorMessage, $$.annotation, DiagnosticSeverity.error))
                            if ($.quoted) {
                                onError(`value '${$$$.value}' must be quoted`, $$.annotation, DiagnosticSeverity.error)
                            }
                            sideEffectsAPIs.forEach(s => {
                                s.onString({
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
                            valueBuilder.setValue($$$.value, errorMessage => onError(errorMessage, $$.annotation, DiagnosticSeverity.error))
                            if (!$.quoted) {
                                onError(`value '${$$$.value}' must be unquoted`, $$.annotation, DiagnosticSeverity.error)
                            }
                            sideEffectsAPIs.forEach(s => {
                                s.onString({
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
            }
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

function defaultInitializeNode<TokenAnnotation>(
    annotation: TokenAnnotation,
    nodeDefinition: def.NodeDefinition,
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
    propDefinition: def.PropertyDefinition,
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
        case "tagged union": {
            const $ = propDefinition.type[1]
            nodeBuilder.getTaggedUnion(propKey).setState($["default option"].name, errorMessage => onError(errorMessage, annotation, DiagnosticSeverity.error))
            break
        }
        case "string": {
            const $ = propDefinition.type[1]
            nodeBuilder.getValue(propKey).setValue($["default value"], errorMessage => onError(errorMessage, annotation, DiagnosticSeverity.error))
            break
        }
        default:
            assertUnreachable(propDefinition.type[0])
    }
}

function getPropertyComments(node: buildAPI.Node, propertyName: string, propertyDefinition: def.PropertyDefinition): buildAPI.Comments {
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
        case "tagged union": {
            return node.getTaggedUnion(propertyName).comments
        }
        case "string": {
            return node.getValue(propertyName).comments
        }
        default:
            return assertUnreachable(propertyDefinition.type[0])
    }
}

function createNodeDeserializer<TokenAnnotation, NonTokenAnnotation>(
    nodeDefinition: def.NodeDefinition,
    keyPropertyDefinition: def.PropertyDefinition | null,
    nodeBuilder: buildAPI.Node,
    keyProperty: def.PropertyDefinition | null,
    sideEffectsAPI: sideEffectAPI.NodeHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: buildAPI.Comments,
): astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        array: $ => {
            if ($.data.type[0] !== "shorthand type") {
                onError("not a list", $.annotation, DiagnosticSeverity.error)
            }
            type ExpectedElement = {
                name: string
                propDefinition: def.PropertyDefinition
                getHandler: () => astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>
            }

            type ExpectedElements = ExpectedElement[]


            const shorthandTypeSideEffects = sideEffectsAPI.map(s => {
                return s.onShorthandTypeOpen({
                    data: $.data,
                    annotation: {
                        annotation: $.annotation,
                        nodeDefinition: nodeDefinition,
                        keyPropertyDefinition: keyPropertyDefinition,
                    },
                })
            })

            const expectedElements: ExpectedElements = []

            nodeDefinition.properties.forEach((propDefinition, propKey) => {
                if (keyProperty === propDefinition) {
                    return
                }
                expectedElements.push({
                    name: propKey,
                    propDefinition: propDefinition,
                    getHandler: () => {
                        return createPropertyDeserializer(
                            propDefinition,
                            propKey,
                            nodeBuilder,
                            shorthandTypeSideEffects.map(s => {
                                return s.onProperty({
                                    annotation: {
                                        propKey: propKey,
                                        definition: propDefinition,
                                    },
                                })
                            }),
                            onError,
                            () => { //flagNondefaultPropertiesFound
                                //
                            },
                        )
                    },
                })
            })
            if ($.data.type[0] !== "shorthand type") {
                onError("array is not a shorthand type", $.annotation, DiagnosticSeverity.error)
            }
            let index = 0
            return {
                element: () => {
                    const ee = expectedElements[index]
                    index++
                    if (ee === undefined) {
                        const dvh = astncore.createDummyValueHandler()
                        return {
                            object: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.object(data)
                            },
                            array: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.array(data)
                            },
                            string: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.string(data)
                            },
                            taggedUnion: data => {
                                onError("superfluous element", data.annotation, DiagnosticSeverity.error)
                                return dvh.taggedUnion(data)
                            },
                        }
                    } else {
                        return ee.getHandler()
                    }
                },
                arrayEnd: $$ => {

                    addComments(targetComments, $$.annotation)
                    const missing = expectedElements.length - index
                    if (missing > 0) {
                        onError(`${missing} missing element(s): ${expectedElements.slice(index).map(ee => `'${ee.name}'`).join(", ")}`, $$.annotation, DiagnosticSeverity.error)
                        for (let i = index; i !== expectedElements.length; i += 1) {
                            const ee = expectedElements[i]

                            defaultInitializeProperty(
                                $.annotation,
                                ee.propDefinition,
                                ee.name,
                                nodeBuilder,
                                onError,
                            )
                        }
                    }

                    shorthandTypeSideEffects.forEach(s => {
                        s.onShorthandTypeClose({
                            annotation: {
                                annotation: $$.annotation,
                            },
                        })
                    })
                    return p.value(null)
                },
            }
        },
        object: $ => {

            if ($.data.type[0] !== "verbose type") {
                onError("expected a verbose type: ( )", $.annotation, DiagnosticSeverity.warning)
            }


            addComments(targetComments, $.annotation)

            const typeSideEffects = sideEffectsAPI.map(s => {
                return s.onVerboseTypeOpen({
                    data: $.data,
                    annotation: {
                        annotation: $.annotation,
                        nodeDefinition: nodeDefinition,
                        keyPropertyDefinition: keyPropertyDefinition,
                    },
                })
            })

            const processedProperties: {
                [key: string]: {
                    annotation: TokenAnnotation
                    isNonDefault: boolean
                }
            } = {}
            return {
                property: $$ => {
                    const key = $$.data.key
                    const propertyDefinition = nodeDefinition.properties.get(key)
                    if (propertyDefinition === null) {
                        onError(`unknown property: '${key}'. Choose from ${nodeDefinition.properties.getKeys().map(k => `'${k}'`).join(", ")}`, $$.annotation, DiagnosticSeverity.error)
                        typeSideEffects.forEach(s => {
                            s.onUnexpectedProperty({
                                data: $$.data,
                                annotation: {
                                    nodeDefinition: nodeDefinition,
                                    key: $$.data.key,
                                    annotation: $$.annotation,
                                },
                            })
                        })
                        return p.value(astncore.createDummyRequiredValueHandler())
                    } else {

                        const pp = {
                            annotation: $$.annotation,
                            isNonDefault: false,
                        }
                        processedProperties[key] = pp

                        if (propertyDefinition === keyProperty) {
                            onError("unexpected identifying property", $$.annotation, DiagnosticSeverity.error)
                            typeSideEffects.forEach(s => {
                                s.onUnexpectedProperty({
                                    data: $$.data,
                                    annotation: {
                                        nodeDefinition: nodeDefinition,
                                        key: $$.data.key,
                                        annotation: $$.annotation,
                                    },
                                })
                            })
                            return p.value(astncore.createDummyRequiredValueHandler())
                        } else {

                            addComments(getPropertyComments(nodeBuilder, key, propertyDefinition), $.annotation)
                            return p.value(wrap(createPropertyDeserializer(
                                propertyDefinition,
                                key,
                                nodeBuilder,
                                typeSideEffects.map(s => {
                                    return s.onProperty({
                                        data: $$.data,
                                        annotation: {
                                            definition: propertyDefinition,
                                            key: key,
                                            annotation: $$.annotation,
                                        },
                                    })
                                }),
                                onError,
                                () => {
                                    pp.isNonDefault = true
                                },
                            )))
                        }
                    }

                },
                objectEnd: $$ => {
                    addComments(targetComments, $$.annotation)
                    let hadNonDefaultProperties = false

                    nodeDefinition.properties.forEach((propDefinition, propKey) => {
                        if (propDefinition === keyProperty) {
                            return
                        }
                        const pp = processedProperties[propKey]
                        if (pp === undefined) {
                            defaultInitializeProperty(
                                $.annotation,
                                propDefinition,
                                propKey,
                                nodeBuilder,
                                onError,
                            )
                        } else {
                            if (!pp.isNonDefault) {
                                onError(`property '${propKey}' has default value, remove`, pp.annotation, DiagnosticSeverity.warning)
                            } else {
                                hadNonDefaultProperties = true
                            }
                        }
                    })
                    if (hadNonDefaultProperties) {
                        flagNonDefaultPropertiesFound()
                    }
                    typeSideEffects.forEach(s => {
                        s.onVerboseTypeClose({
                            annotation: {
                                annotation: $$.annotation,
                            },
                        })
                    })
                    return p.value(null)
                },
            }
        },
        taggedUnion: $ => {
            return createUnexpectedTaggedUnionHandler(`expected a type`, $.annotation, onError)
        },
        string: $ => {
            return createUnexpectedStringHandler(`expected a type`, $.annotation, onError)

        },
    }
}

export function createDatasetDeserializer<TokenAnnotation, NonTokenAnnotation>(
    dataset: id.IDataset,
    sideEffectsHandlers: sideEffectAPI.NodeHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
): astncore.TreeHandler<TokenAnnotation, NonTokenAnnotation> {

    return {
        root: wrap(
            createNodeDeserializer(
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
