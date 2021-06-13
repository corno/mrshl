import * as p from "pareto"
import * as astncore from "astn-core"
import * as buildAPI from "../../../interfaces/buildAPI"
import * as def from "../../../interfaces/typedParserDefinitions"
import * as sideEffectAPI from "../../../interfaces/streamingValidationAPI"
import { DiagnosticSeverity } from "../../../interfaces/DiagnosticSeverity"
import { createVerboseNodeDeserializer } from "./createVerboseNodeDeserializer"
import { createShorthandNodeDeserializer } from "./createShorthandNodeDeserializer"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

export type OnError<TokenAnnotation> = (message: string, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void

export function wrap<TokenAnnotation, NonTokenAnnotation>(
    handler: astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation>
): astncore.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
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

export function createUnexpectedArrayHandler<TokenAnnotation, NonTokenAnnotation>(
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

export function createUnexpectedObjectHandler<TokenAnnotation, NonTokenAnnotation>(
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

export function createUnexpectedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>(
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

export function createUnexpectedStringHandler<TokenAnnotation>(
    message: string,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
): p.IValue<boolean> {
    onError(message, annotation, DiagnosticSeverity.error)
    return p.value(false)
}

export function createDictionaryDeserializer<TokenAnnotation, NonTokenAnnotation>(
    $$: def.DictionaryDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.PropertyHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
): astncore.OnObject<TokenAnnotation, NonTokenAnnotation> {
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
            property: $ => {

                if (foundKeys.includes($.data.keyString.value)) {
                    onError("double key", $.annotation, DiagnosticSeverity.error)
                }
                foundKeys.push($.data.keyString.value)
                const entry = dictionary.createEntry()
                //const entry = collBuilder.createEntry(errorMessage => onError(errorMessage, propertyData.keyRange))
                entry.node.getValue($$["key property"].name).setValue($.data.keyString.value, errorMessage => onError(errorMessage, $.annotation, DiagnosticSeverity.error))
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
    }
}

export function createListDeserializer<TokenAnnotation, NonTokenAnnotation>(
    $$: def.ListDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.PropertyHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
): astncore.OnArray<TokenAnnotation, NonTokenAnnotation> {
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
    }
}

export function doOption<TokenAnnotation, NonTokenAnnotation>(
    $: def.TaggedUnionDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    stringData: astncore.SimpleStringData,
    annotation: TokenAnnotation,
    sgse: sideEffectAPI.TaggedUnionHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
): astncore.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
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
        return astncore.createDummyRequiredValueHandler()
    } else {

        const state = stateGroup.setState(optionName, errorMessage => onError(errorMessage, annotation, DiagnosticSeverity.error))
        addComments(stateGroup.comments, annotation)
        if ($["default option"].get() !== option) {
            flagNonDefaultPropertiesFound()
        }
        return wrap(
            createNodeDeserializer(
                option.node,
                null,
                state.node,
                null,
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
            ),
        )
    }
}

export function createTaggedUnionDeserializer<TokenAnnotation, NonTokenAnnotation>(
    $: def.TaggedUnionDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.PropertyHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
): astncore.OnTaggedUnion<TokenAnnotation, NonTokenAnnotation> {
    return $$ => {
        return {
            option: $$$ => {
                return doOption(
                    $,
                    propKey,
                    nodeBuilder,
                    $$$.data.optionString,
                    $$$.annotation,
                    sideEffectsAPIs.map(s => {
                        return s.onTaggedUnion({
                            annotation: {
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
                //
            },
        }
    }
}

export function createMultilineStringDeserializer<TokenAnnotation>(
    _$: def.StringValueDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    _sideEffectsAPIs: sideEffectAPI.PropertyHandler<TokenAnnotation>[],
    _onError: OnError<TokenAnnotation>,
    _flagNonDefaultPropertiesFound: () => void,
): astncore.OnMultilineString<TokenAnnotation> {
    return $$ => {
        const valueBuilder = nodeBuilder.getValue(propKey)

        addComments(valueBuilder.comments, $$.annotation)
        throw new Error("IMPLEMENT MULTILINE")
    }
}

export function createSimpleStringDeserializer<TokenAnnotation>(
    $: def.StringValueDefinition,
    propKey: string,
    nodeBuilder: buildAPI.Node,
    sideEffectsAPIs: sideEffectAPI.PropertyHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
): astncore.OnSimpleString<TokenAnnotation> {
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
                    syncValue: valueBuilder,
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
        return p.value(false)
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

export function createNodeDeserializer<TokenAnnotation, NonTokenAnnotation>(
    nodeDefinition: def.NodeDefinition,
    _keyPropertyDefinition: def.PropertyDefinition | null,
    nodeBuilder: buildAPI.Node,
    keyProperty: def.PropertyDefinition | null,
    sideEffectsAPI: sideEffectAPI.NodeHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    targetComments: buildAPI.Comments,
): astncore.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        array: createShorthandNodeDeserializer(
            nodeDefinition,
            keyProperty,
            nodeBuilder,
            keyProperty,
            sideEffectsAPI,
            onError,
            flagNonDefaultPropertiesFound,
            targetComments,
        ),
        object: createVerboseNodeDeserializer(
            nodeDefinition,
            keyProperty,
            nodeBuilder,
            keyProperty,
            sideEffectsAPI,
            onError,
            flagNonDefaultPropertiesFound,
            targetComments,
        ),
        taggedUnion: $ => {
            return createUnexpectedTaggedUnionHandler(`expected a type`, $.annotation, onError)
        },
        simpleString: $ => {
            return createUnexpectedStringHandler(`expected a type`, $.annotation, onError)
        },
        multilineString: $ => {
            return createUnexpectedStringHandler(`expected a type`, $.annotation, onError)
        },
    }
}
