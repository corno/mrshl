import * as astncore from "astn-core"
import * as buildAPI from "../interfaces/buildAPI"
import * as def from "../interfaces/typedParserDefinitions"
import * as sideEffectAPI from "../interfaces/streamingValidationAPI"
import { DiagnosticSeverity } from "../interfaces/DiagnosticSeverity"
import { createVerboseNodeDeserializer } from "./createVerboseNodeDeserializer"
import { createShorthandNodeDeserializer } from "./createShorthandNodeDeserializer"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

export type OnError<TokenAnnotation> = (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void

export function wrap<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation, ReturnType>
): astncore.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation, ReturnType> {
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

export function createUnexpectedArrayHandler<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
    createReturnValue: () => ReturnType,
): astncore.ArrayHandler<TokenAnnotation, NonTokenAnnotation, ReturnType> {
    onError(message, annotation, DiagnosticSeverity.error)

    return {
        element: () => {
            return astncore.createDummyValueHandler(createReturnValue)
        },
        arrayEnd: () => {
            return createReturnValue()
        },
    }
}

export function createUnexpectedObjectHandler<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
    createReturnValue: () => ReturnType,
): astncore.ObjectHandler<TokenAnnotation, NonTokenAnnotation, ReturnType> {
    onError(message, annotation, DiagnosticSeverity.error)

    return {
        property: () => {
            return astncore.createDummyRequiredValueHandler(createReturnValue)
        },
        objectEnd: () => {
            return createReturnValue()
        },
    }
}

export function createUnexpectedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
    createReturnValue: () => ReturnType,
): astncore.TaggedUnionHandler<TokenAnnotation, NonTokenAnnotation, ReturnType> {
    onError(message, annotation, DiagnosticSeverity.error)

    return {
        option: () => {
            return astncore.createDummyRequiredValueHandler(createReturnValue)
        },
        missingOption: () => {
            //
        },
        end: () => {
            return createReturnValue()
        },
    }
}

export function createUnexpectedStringHandler<TokenAnnotation, ReturnType>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
    createReturnValue: () => ReturnType
): ReturnType {
    onError(message, annotation, DiagnosticSeverity.error)
    return createReturnValue()
}

export function createDictionaryDeserializer<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    $$: def.DictionaryDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.ValueHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    createReturnValue: () => ReturnType,
): astncore.OnObject<TokenAnnotation, NonTokenAnnotation, ReturnType> {
    return $ => {
        const dictionary = nodeBuilder.getDictionary(propKey)
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
            property: $p => {

                if (foundKeys.includes($p.data.keyString.value)) {
                    onError("double key", $p.annotation, DiagnosticSeverity.error)
                }
                foundKeys.push($p.data.keyString.value)
                const entry = dictionary.createEntry()
                //const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                if (entry.key === null) {
                    throw new Error('unexpected')
                }
                entry.key.setValue($p.data.keyString.value, errorMessage => onError(errorMessage, $p.annotation, DiagnosticSeverity.error))
                addComments(entry.comments, $p.annotation)


                const propertySideEffects = dictionarySideEffects.map(s => {
                    return s.onEntry({
                        data: $p.data,
                        annotation: {
                            annotation: $p.annotation,
                            nodeDefinition: $$.node,
                        },
                    })
                })
                return wrap(
                    createNodeDeserializer(
                        $$.node,
                        entry.node,
                        propertySideEffects,
                        onError,
                        () => {
                            //
                        },
                        entry.comments,
                        createReturnValue,
                    ),
                )
            },
            objectEnd: $e => {

                dictionarySideEffects.forEach(s => {
                    s.onClose({
                        annotation: {
                            annotation: $e.annotation,
                        },
                    })
                })
                if (foundKeys.length !== 0) {
                    flagNonDefaultPropertiesFound()
                }
                addComments(dictionary.comments, $e.annotation)
                return createReturnValue()

            },
        }
    }
}

export function createListDeserializer<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    $$: def.ListDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.ValueHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    createReturnValue: () => ReturnType,
): astncore.OnArray<TokenAnnotation, NonTokenAnnotation, ReturnType> {
    return $ => {
        if ($.data.type[0] !== "list") {
            onError("not a list", $.annotation, DiagnosticSeverity.error)
        }
        const list = nodeBuilder.getList(propKey)

        let hasEntries = false
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
                    entry.node,
                    elementSideEffects,
                    onError,
                    () => {
                        //
                    },
                    entry.comments,
                    createReturnValue,
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
                return createReturnValue()
            },
        }
    }
}

export function createTaggedUnionDeserializer<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    $: def.TaggedUnionDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.ValueHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    createReturnValue: () => ReturnType,
): astncore.OnTaggedUnion<TokenAnnotation, NonTokenAnnotation, ReturnType> {
    return $$ => {
        return {
            option: $$$ => {

                function doOption(
                    $: def.TaggedUnionDefinition,
                    propKey: string,
                    nodeBuilder: buildAPI.Node,
                    stringData: astncore.SimpleStringData,
                    annotation: TokenAnnotation,
                    sgse: sideEffectAPI.TaggedUnionHandler<TokenAnnotation>[],
                    onError: OnError<TokenAnnotation>,
                    flagNonDefaultPropertiesFound: () => void,
                ): astncore.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation, ReturnType> {
                    const optionName = stringData.value
                    const option = $.options.get(stringData.value)
                    const stateGroup = nodeBuilder.getTaggedUnion(propKey)
                    addComments(stateGroup.comments, annotation)

                    if (option === null) {
                        onError(`unknown option: '${optionName}', choose from: ${$.options.getKeys().map(k => `'${k}'`).join(", ")}`, annotation, DiagnosticSeverity.error)
                        sgse.forEach(s => {
                            return s.onUnexpectedOption({
                                data: {
                                    optionString: stringData,
                                },
                                annotation: {
                                    annotation: annotation,
                                    //stateGroupDefinition: $,
                                },
                            })
                        })
                        return astncore.createDummyRequiredValueHandler(createReturnValue)
                    } else {

                        const state = stateGroup.setState(optionName, errorMessage => onError(errorMessage, annotation, DiagnosticSeverity.error))
                        addComments(stateGroup.comments, annotation)
                        if ($["default option"].get() !== option) {
                            flagNonDefaultPropertiesFound()
                        }
                        return wrap(
                            createNodeDeserializer(
                                option.node,
                                state.node,
                                sgse.map(s => {
                                    return s.onOption({
                                        data: {
                                            optionString: stringData,
                                        },
                                        annotation: {
                                            annotation: annotation,
                                            definition: option,
                                            //stateGroupDefinition: $,
                                        },
                                    })
                                }),
                                onError,
                                flagNonDefaultPropertiesFound,
                                stateGroup.comments,
                                createReturnValue,
                            ),
                        )
                    }
                }
                return doOption(
                    $,
                    propKey,
                    nodeBuilder,
                    $$$.data.optionString,
                    $$$.annotation,
                    sideEffectsAPIs.map(s => {
                        return s.onTaggedUnion({
                            annotation: {
                                definition: $,
                                annotation: $$.annotation,
                            },
                        })
                    }),
                    onError,
                    flagNonDefaultPropertiesFound,
                )
            },
            missingOption: () => {
                onError("missing option", $$.annotation, DiagnosticSeverity.error)
            },
            end: () => {
                return createReturnValue()
            },
        }
    }
}

export function createMultilineStringDeserializer<TokenAnnotation, ReturnType>(
    _$: def.MultiLineStringDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    _sideEffectsAPIs: sideEffectAPI.ValueHandler<TokenAnnotation>[],
    _onError: OnError<TokenAnnotation>,
    _flagNonDefaultPropertiesFound: () => void,
    createReturnValue: () => ReturnType,
): astncore.OnMultilineString<TokenAnnotation, ReturnType> {
    return $$ => {
        const valueBuilder = nodeBuilder.getValue(propKey)

        addComments(valueBuilder.comments, $$.annotation)
        throw new Error("IMPLEMENT MULTILINE")
        return createReturnValue()
    }
}

export function createSimpleStringDeserializer<TokenAnnotation, ReturnType>(
    $: def.SimpleStringDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.ValueHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    createReturnValue: () => ReturnType,
): astncore.OnSimpleString<TokenAnnotation, ReturnType> {
    return $$ => {
        const valueBuilder = nodeBuilder.getValue(propKey)

        addComments(valueBuilder.comments, $$.annotation)

        const value = $$.data.value

        if (value !== $["default value"]) {
            flagNonDefaultPropertiesFound()
        }
        valueBuilder.setValue(value, errorMessage => onError(errorMessage, $$.annotation, DiagnosticSeverity.error))

        sideEffectsAPIs.forEach(s => {
            s.onSimpleString({
                value: value,
                data: $$.data,
                annotation: {
                    definition: $,
                    getSuggestions: () => {
                        return valueBuilder.getSuggestions()
                    },
                    annotation: $$.annotation,
                    //  valueBuilder:   valueBuilder,
                    //     $
                },
            })
        })
        switch ($$.data.wrapping[0]) {
            case "none": {
                if ($.quoted) {
                    onError(`value '${value}' must be quoted`, $$.annotation, DiagnosticSeverity.error)
                }
                break
            }
            case "quote": {
                if (!$.quoted) {
                    onError(`value '${value}' must not be quoted`, $$.annotation, DiagnosticSeverity.error)
                }
                break
            }
            case "apostrophe": {
                if (!$.quoted) {
                    onError(`value '${value}' must${$.quoted ? "" : " not"} be quoted`, $$.annotation, DiagnosticSeverity.error)
                }
                break
            }
            default:
                assertUnreachable($$.data.wrapping[0])
        }
        return createReturnValue()
    }
}

export function defaultInitializeNode<TokenAnnotation>(
    annotation: TokenAnnotation,
    nodeDefinition: def.NodeDefinition,
    nodeBuilder: buildAPI.Node,
    onError: OnError<TokenAnnotation>,
): void {
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


export function defaultInitializeProperty<TokenAnnotation>(
    annotation: TokenAnnotation,
    propDefinition: def.PropertyDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    onError: OnError<TokenAnnotation>,
): void {

    switch (propDefinition.type[0]) {
        case "dictionary": {
            //nothing to do
            break
        }
        case "list": {
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
        case "simple string": {
            const $ = propDefinition.type[1]
            nodeBuilder.getValue(propKey).setValue($["default value"], errorMessage => onError(errorMessage, annotation, DiagnosticSeverity.error))
            break
        }
        case "multiline string": {
            //const $ = propDefinition.type[1]
            nodeBuilder.getValue(propKey).setValue("", errorMessage => onError(errorMessage, annotation, DiagnosticSeverity.error))
            break
        }
        default:
            assertUnreachable(propDefinition.type[0])
    }
}

export function createNodeDeserializer<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    nodeDefinition: def.NodeDefinition,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPI: sideEffectAPI.ValueHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: buildAPI.Comments,
    createReturnValue: () => ReturnType,
): astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation, ReturnType> {
    return {
        array: createShorthandNodeDeserializer(
            nodeDefinition,
            nodeBuilder,
            sideEffectsAPI,
            onError,
            flagNonDefaultPropertiesFound,
            targetComments,
            createReturnValue,
        ),
        object: createVerboseNodeDeserializer(
            nodeDefinition,
            nodeBuilder,
            sideEffectsAPI,
            onError,
            flagNonDefaultPropertiesFound,
            targetComments,
            createReturnValue,
        ),
        taggedUnion: $ => {
            return createUnexpectedTaggedUnionHandler(
                `expected a type`,
                $.annotation,
                onError,
                createReturnValue,
            )
        },
        simpleString: $ => {
            onError(`expected a type`, $.annotation, DiagnosticSeverity.error)
            return createReturnValue()
        },
        multilineString: $ => {
            onError(`expected a type`, $.annotation, DiagnosticSeverity.error)
            return createReturnValue()
        },
    }
}
