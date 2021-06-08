/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../../interfaces/streamingValidationAPI"
import * as def from "../../interfaces/typedParserDefinitions"
import * as fp from "fountain-pen"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type GetCodeCompletions = () => string[]

function createCodeCompletionForProperty(prop: def.PropertyDefinition, shorthand: boolean): fp.InlineSegment {
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
        case "tagged union": {
            const $ = prop.type[1]
            return [
                `| '${$["default option"].name}' `,
                createCodeCompletionForNode($["default option"].get().node, null, shorthand),
            ]
        }
        case "string": {
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

function createCodeCompletionForShorthandProperties(node: def.NodeDefinition, keyProperty: def.PropertyDefinition | null): fp.InlineSegment {
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

function createCodeCompletionForVerboseProperties(node: def.NodeDefinition, keyProperty: def.PropertyDefinition | null): fp.Block {
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

function createCodeCompletionForNode(node: def.NodeDefinition, keyProperty: def.PropertyDefinition | null, shorthand: boolean): fp.InlineSegment {
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
    getCodeCompletionsAfterToken: GetCodeCompletions | null,
    //description: string
) => void


function createCodeCompletionsForPropertyGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.PropertyHandler<Annotation> {
    return {
        onDictionary: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onDictionary",
            )
            return createCodeCompletionForDictionaryGenerator(onToken)
        },
        onList: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onList",
            )
            return createCodeCompletionForListGenerator(onToken)
        },
        onTaggedUnion: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onTaggedUnion",
            )
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
        },
        onNull: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onNull",
            )
        },
        onString: $ => {
            onToken(
                $.annotation.annotation,
                () => {
                    return $.annotation.syncValue.getSuggestions().map(sugg => {
                        return $.annotation.definition.quoted ? `"${sugg}"` : sugg
                    })
                },
                null,
                //"onString",
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
        onClose: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onLIstClose",
            )
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
        onClose: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onDictionaryClose",
            )
        },
        onEntry: $ => {
            onToken(
                $.annotation.annotation,
                null,
                () => {
                    function createCompForNode(shorthand: boolean) {
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
                        createCompForNode(false),
                        createCompForNode(true),
                    ]
                },
                //"onEntry",
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
            return createCodeCompletionsForPropertyGenerator(onToken)
        },
        onShorthandTypeClose: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onShorthandTypeClose",
            )
        },
    }
}

function createCodeCompletionForVerboseTypeGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.VerboseTypeHandler<Annotation> {
    return {
        onUnexpectedProperty: $ => {
            onToken(
                $.annotation.annotation,
                () => {
                    return $.annotation.nodeDefinition.properties.getKeys()
                },
                null,
                //"onUnknownProperty",
            )

        },
        onProperty: $ => {
            onToken(
                $.annotation.annotation,
                null,
                () => {
                    const out: string[] = []
                    fp.serialize(
                        [
                            fp.line([
                                " ",
                                createCodeCompletionForProperty($.annotation.definition, false),
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
                //"onProperty",
            )
            return createCodeCompletionsForPropertyGenerator(onToken)
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
        onVerboseTypeClose: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onVerboseTypeClose",
            )
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
                //"onShorthandTypeOpen",
            )
            return createCodeCompletionForShorthandTypeGenerator(onToken)
        },
        onVerboseTypeOpen: $ => {
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
                //"onVerboseTypeClose",
            )
            return createCodeCompletionForVerboseTypeGenerator(onToken)
        },
    }
}

export function createCodeCompletionsGenerator<Annotation>(
    onToken: OnToken<Annotation>,
    onEnd: () => void,
): streamVal.RootHandler<Annotation> {

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

    return createCodeCompletionGenerator(onToken, onEnd)
}