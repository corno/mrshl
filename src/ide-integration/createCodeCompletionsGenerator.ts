/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../interfaces/streamingValidationAPI"
import * as fp from "fountain-pen"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type GetCodeCompletions = () => string[]

function createCodeCompletionForProperty(prop: streamVal.PropertyDefinition, shorthand: boolean): fp.InlineSegment {
    switch (prop.type[0]) {
        case "collection": {
            const $ = prop.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    return `{ }`
                }
                case "list": {
                    return `[ ]`
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = prop.type[1]

            return createCodeCompletionForNode($.type.get().node, null, shorthand)
        }
        case "state group": {
            const $ = prop.type[1]
            return [
                `| '${$["default state"].name}' `,
                createCodeCompletionForNode($["default state"].get().node, null, shorthand),
            ]
        }
        case "value": {
            const $ = prop.type[1]
            if ($.quoted) {
                return `"${$["default value"]}"`
            } else {
                return `${$["default value"]}`

            }
        }
        default:
            return assertUnreachable(prop.type[0])
    }
}

function createCodeCompletionForShorthandProperties(node: streamVal.NodeDefinition, keyProperty: streamVal.PropertyDefinition | null): fp.InlineSegment {
    const x: fp.InlineSegment[] = []
    node.properties.mapSorted((prop, _propKey) => {
        if (prop === keyProperty) {
            return
        }
        x.push(' ')
        x.push(createCodeCompletionForProperty(prop, true))
    })
    return x
}

function createCodeCompletionForVerboseProperties(node: streamVal.NodeDefinition, keyProperty: streamVal.PropertyDefinition | null): fp.Block {
    const x: fp.Block[] = []
    node.properties.mapSorted((prop, propKey) => {
        if (prop === keyProperty) {
            return
        }
        x.push(fp.line([
            `'${propKey}': `,
            createCodeCompletionForProperty(prop, false),
        ]))
    })
    return x
}

function createCodeCompletionForNode(node: streamVal.NodeDefinition, keyProperty: streamVal.PropertyDefinition | null, shorthand: boolean): fp.InlineSegment {
    if (shorthand) {
        return [
            '<', createCodeCompletionForShorthandProperties(node, keyProperty), ' >',
        ]
    } else {
        return [
            '(',
            () => {
                return createCodeCompletionForVerboseProperties(node, keyProperty)
            },
            ')',
        ]
    }
}

export type OnToken<Annotation> = (
    annotation: Annotation,
    getCodeCompletionsInToken: GetCodeCompletions | null,
    getCodeCompletionsAfterToken: GetCodeCompletions | null
) => void


function createCodeCompletionGenerator<Annotation>(
    onToken: OnToken<Annotation>,
    onEnd2: () => void,
): streamVal.RootHandler<Annotation> {
    return {
        node: createCodeCompletionForNodeGenerator<Annotation>(onToken),
        onEnd: () => {
            onEnd2()
        },
    }
}


function createStateGroupCodeCompletionGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.TaggedUnionHandler<Annotation> {
    return {
        onOption: () => {
            return createCodeCompletionForNodeGenerator(onToken)
        },
        // onUnexpectedOption: $ => {
        //     onToken(
        //         $.annotation.annotation,
        //         () => {
        //             return Object.keys($.annotation.stateGroupDefinition.states.mapSorted(s => s))
        //         },
        //         null
        //     )
        // },
    }
}

function createCodeCompletionForPropertyGenerator<Annotation>(
    onToken: OnToken<Annotation>,

): streamVal.PropertyHandler<Annotation> {
    return {

        onDictionary: () => {
            return createCodeCompletionForDictionaryGenerator(onToken)
        },
        onList: () => {
            return createCodeCompletionForListGenerator(onToken)
        },
        onStateGroup: () => {
            return createStateGroupCodeCompletionGenerator(onToken)
        },
        onNull: () => {
            //
        },
        onScalarValue: $ => {
            onToken(
                $.annotation.annotation,
                () => {
                    return $.annotation.syncValue.getSuggestions().map(sugg => {
                        return $.annotation.definition.quoted ? `"${sugg}"` : sugg
                    })
                },
                null,
            )
        },
        onComponent: () => {
            return createCodeCompletionForNodeGenerator(onToken)
        },
    }
}

function createCodeCompletionForListGenerator<Annotation>(
    onToken: OnToken<Annotation>,

): streamVal.ListHandler<Annotation> {
    return {
        onClose: () => {
            //
        },
        onEntry: () => {
            return createCodeCompletionForNodeGenerator(onToken)
        },
    }
}

function createCodeCompletionForDictionaryGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.DictionaryHandler<Annotation> {
    return {
        onClose: () => {
            //
        },
        onEntry: $ => {
            onToken(
                $.annotation.annotation,
                null,
                () => {
                    function create(shorthand: boolean) {
                        const out: string[] = []
                        fp.serialize(
                            [
                                fp.line([
                                    " ",
                                    createCodeCompletionForNode($.annotation.nodeDefinition, $.annotation.keyProperty, shorthand),
                                ]),
                            ],
                            "    ",
                            true,
                            codeCompletion => {
                                out.push(codeCompletion)
                            }
                        )
                        return out.map((line, index) => {
                            //don't indent the first line
                            if (index === 0) {
                                return line
                            }
                            return line
                            //return contextData.indentation + line
                        }).join("\n")
                    }
                    return [
                        create(false),
                        create(true),
                    ]
                }
            )
            return createCodeCompletionForNodeGenerator(onToken)
        },
    }
}

function createCodeCompletionForShorthandTypeGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.ShorthandTypeHandler<Annotation> {
    return {
        onProperty: () => {
            return createCodeCompletionForPropertyGenerator(onToken)
        },
        onShorthandTypeClose: () => {
            //
        },
    }
}

function createCodeCompletionForVerboseTypeGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.TypeHandler<Annotation> {
    return {
        onProperty: $ => {
            const propDefinition = $.annotation.nodeDefinition.properties.get($.annotation.key)
            if (propDefinition === null) {
                onToken(
                    $.annotation.annotation,
                    () => {
                        return $.annotation.nodeDefinition.properties.getKeys()
                    },
                    null
                )
                throw new Error("IMPLEMENT ME")
            } else {
                onToken(
                    $.annotation.annotation,
                    null,
                    () => {
                        const out: string[] = []
                        fp.serialize(
                            [
                                fp.line([
                                    " ",
                                    createCodeCompletionForProperty(propDefinition, false),
                                ]),
                            ],
                            "    ",
                            true,
                            codeCompletion => {
                                out.push(codeCompletion)
                            }
                        )
                        return [out.map((line, index) => {
                            //don't indent the first line
                            if (index === 0) {
                                return line
                            }
                            return line
                            //return contextData.indentation + line
                        }).join("\n")]
                    },
                )
                return createCodeCompletionForPropertyGenerator(onToken)
            }
        },
        // onUnexpectedProperty: () => {
        //     //FIXME
        //     // onToken(
        //     //     $.annotation.annotation,
        //     //     () => {
        //     //         return $.annotation.expectedProperties
        //     //     },
        //     //     null
        //     // )
        // },
        onTypeClose: () => {
            //
        },
    }
}

function createCodeCompletionForNodeGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.NodeHandler<Annotation> {

    return {
        onShorthandTypeOpen: $ => {
            onToken(
                $.annotation.annotation,
                null,
                () => {
                    const out: string[] = []
                    fp.serialize(
                        [
                            fp.line(createCodeCompletionForShorthandProperties($.annotation.nodeDefinition, $.annotation.keyPropertyDefinition)),
                        ],
                        "    ",
                        true,
                        codeCompletion => {
                            out.push(codeCompletion)
                        }
                    )
                    return [
                        out.join("\n"),
                    ]
                },
            )
            return createCodeCompletionForShorthandTypeGenerator(onToken)
        },
        onTypeOpen: $ => {
            onToken(
                $.annotation.annotation,
                null,
                () => {
                    const out: string[] = []
                    fp.serialize(
                        [
                            '',
                            () => {
                                return createCodeCompletionForVerboseProperties($.annotation.nodeDefinition, $.annotation.keyPropertyDefinition)
                            },
                            '',
                        ],
                        "    ",
                        true,
                        codeCompletion => {
                            out.push(codeCompletion)
                        }
                    )
                    return [
                        out.join("\n"),
                    ]
                },
            )
            return createCodeCompletionForVerboseTypeGenerator(onToken)
        },
    }
}

export function createCodeCompletionsGenerator<Annotation>(
    onToken: OnToken<Annotation>,
    onEnd: () => void,
): streamVal.RootHandler<Annotation> {
    return createCodeCompletionGenerator(onToken, onEnd)
}