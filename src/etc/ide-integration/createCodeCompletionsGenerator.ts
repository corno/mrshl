/* eslint
    "max-classes-per-file": off,
*/

import * as sideEffects from "../interfaces/ParsingSideEffectsAPI"
import * as fp from "fountain-pen"
import * as md from "../interfaces/types"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type GetCodeCompletions = () => string[]

function createCodeCompletionForProperty(prop: md.Property, shorthand: boolean): fp.InlineSegment {
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

function createCodeCompletionForShorthandProperties(node: md.Node, keyProperty: md.Property | null): fp.InlineSegment {
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

function createCodeCompletionForVerboseProperties(node: md.Node, keyProperty: md.Property | null): fp.Block {
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

function createCodeCompletionForNode(node: md.Node, keyProperty: md.Property | null, shorthand: boolean): fp.InlineSegment {
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
): sideEffects.Root<Annotation> {
    return {
        node: createCodeCompletionForNodeGenerator<Annotation>(onToken),
        onEnd: () => {
            onEnd2()
        },
    }
}


function createStateGroupCodeCompletionGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): sideEffects.StateGroup<Annotation> {
    return {
        onState: () => {
            return createCodeCompletionForNodeGenerator(onToken)
        },
        onUnexpectedState: $ => {
            onToken(
                $.annotation,
                () => {
                    return Object.keys($.stateGroupDefinition.states.mapSorted(s => s))
                },
                null
            )
        },
    }
}

function createCodeCompletionForPropertyGenerator<Annotation>(
    onToken: OnToken<Annotation>,

): sideEffects.Property<Annotation> {
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
                $.annotation,
                () => {
                    return $.syncValue.getSuggestions().map(sugg => {
                        return $.definition.quoted ? `"${sugg}"` : sugg
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

): sideEffects.List<Annotation> {
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
): sideEffects.Dictionary<Annotation> {
    return {
        onClose: () => {
            //
        },
        onEntry: $ => {
            onToken(
                $.annotation,
                null,
                () => {
                    function create(shorthand: boolean) {
                        const out: string[] = []
                        fp.serialize(
                            [
                                fp.line([
                                    " ",
                                    createCodeCompletionForNode($.nodeDefinition, $.keyProperty, shorthand),
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
): sideEffects.ShorthandType<Annotation> {
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
): sideEffects.Type<Annotation> {
    return {
        onProperty: $ => {
            onToken(
                $.annotation,
                null,
                () => {
                    const out: string[] = []
                    fp.serialize(
                        [
                            fp.line([
                                " ",
                                createCodeCompletionForProperty($.propDefinition, false),
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
        },
        onUnexpectedProperty: $ => {
            onToken(
                $.annotation,
                () => {
                    return $.expectedProperties
                },
                null
            )
        },
        onTypeClose: () => {
            //
        },
    }
}

function createCodeCompletionForNodeGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): sideEffects.Node<Annotation> {

    return {
        onShorthandTypeOpen: $ => {
            onToken(
                $.annotation,
                null,
                () => {
                    const out: string[] = []
                    fp.serialize(
                        [
                            fp.line(createCodeCompletionForShorthandProperties($.nodeDefinition, $.keyPropertyDefinition)),
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
                $.annotation,
                null,
                () => {
                    const out: string[] = []
                    fp.serialize(
                        [
                            '',
                            () => {
                                return createCodeCompletionForVerboseProperties($.nodeDefinition, $.keyPropertyDefinition)
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
): sideEffects.Root<Annotation> {
    return createCodeCompletionGenerator(onToken, onEnd)
}