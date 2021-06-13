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

function serialize(inlineSegment: fp.InlineSegment): string {
    const out: string[] = []
    fp.serialize(
        [
            fp.line(inlineSegment),
        ],
        "    ",
        true,
        codeCompletion => {
            out.push(codeCompletion)
        }
    )
    return out.join("\n")
}

function serializeAlternatives(alts: Alternatives): GetCodeCompletions {
    return () => {
        return alts.alternatives.map(alt => {
            return serialize(alt)
        })
    }
}

type Alternatives = {
    alternatives: fp.InlineSegment[]
}

function createLeaf(segment: fp.InlineSegment): Alternatives {
    return {
        alternatives: [
            segment,
        ],
    }
}

function createCodeCompletionForProperty(
    prop: def.PropertyDefinition,
    onComponent: (def: def.ComponentDefinition) => Alternatives,
    onTaggedUnion: (def: def.TaggedUnionDefinition) => Alternatives,
): Alternatives {
    switch (prop.type[0]) {
        case "collection": {
            const $ = prop.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    return createLeaf(` { }`)
                }
                case "list": {
                    return createLeaf(` [ ]`)
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = prop.type[1]
            return onComponent($)
        }
        case "tagged union": {
            const $ = prop.type[1]
            return onTaggedUnion($)
        }
        case "string": {
            const $ = prop.type[1]
            if ($.quoted) {
                return createLeaf(` "${$["default value"]}"`)
            } else {
                return createLeaf(` ${$["default value"]}`)
            }
        }
        default:
            return assertUnreachable(prop.type[0])
    }
}

function createCodeCompletionForShorthandProperty(
    prop: def.PropertyDefinition,
): Alternatives {
    return createCodeCompletionForProperty(
        prop,
        $ => {
            return createCodeCompletionForShorthandNode($.type.get().node, null)
        },
        $ => {
            return mergeAlternatives($.options.toArray((option, optionName) => {
                const ccsh = createCodeCompletionForShorthandNode(option.node, null)
                return {
                    alternatives: ccsh.alternatives.map(a => {
                        return [
                            [
                                ` '${optionName}'`,
                                a,
                            ],
                        ]
                    }),
                }
            }))
        },
    )
}

function createAlternativesProduct(options: Alternatives[]) {
    const out: Alternatives = {
        alternatives: [],
    }

    //create the (mathematical) product of all combinations
    function nextProp(index: number, current: fp.InlineSegment[]) {
        const currentProp = options[index]
        if (currentProp === undefined) {
            out.alternatives.push(current)
        } else {
            currentProp.alternatives.forEach(a => {
                const sliced = current.slice(0)
                sliced.push(a)
                nextProp(index + 1, sliced)
            })
        }
    }
    nextProp(0, [])
    return out
}

function mergeAlternatives(entries: Alternatives[]) {
    const out: Alternatives = {
        alternatives: [],
    }
    entries.forEach(e => {
        e.alternatives.forEach(e2 => {
            out.alternatives.push(e2)
        })
    })
    return out
}

function createCodeCompletionForShorthandNode(
    node: def.NodeDefinition,
    keyProperty: def.PropertyDefinition | null,
): Alternatives {
    const propertyCodeCompletions: Alternatives[] = []
    node.properties.forEach((prop, _propKey) => {
        if (prop === keyProperty) {
            return
        }
        propertyCodeCompletions.push(createCodeCompletionForShorthandProperty(prop))
    })
    return createAlternativesProduct(propertyCodeCompletions)
}

function createCodeCompletionForVerboseProperty(prop: def.PropertyDefinition): Alternatives {
    return createCodeCompletionForProperty(
        prop,
        $ => {
            return createCodeCompletionAlternativesForVerboseNode($.type.get().node, null)
        },
        $ => {
            const ccvh = createCodeCompletionAlternativesForVerboseNode($["default option"].get().node, null)
            return {
                alternatives: ccvh.alternatives.map(a => {
                    return [
                        [
                            ` | '${$["default option"].name}'`,
                            a,
                        ],
                    ]
                }),
            }
        },
    )
}

// function createCodeCompletionForVerboseProperties(node: def.NodeDefinition, keyProperty: def.PropertyDefinition | null): fp.Block {
//     const x: fp.Block[] = []
//     node.properties.mapSorted((prop, propKey) => {
//         if (prop === keyProperty) {
//             return
//         }
//         x.push(fp.line([
//             `'${propKey}':`,
//             createCodeCompletionForVerboseProperty(prop).x,
//         ]))
//     })
//     return x
// }

function createCodeCompletionForVerboseProperties(node: def.NodeDefinition, keyProperty: def.PropertyDefinition | null): Alternatives {
    const propertyCodeCompletions: Alternatives[] = []
    let dirty = false
    node.properties.forEach((prop, propKey) => {
        if (prop === keyProperty) {
            return
        }
        dirty = true
        propertyCodeCompletions.push({
            alternatives: createCodeCompletionForVerboseProperty(prop).alternatives.map(alt => {
                return () => {
                    return fp.line([
                        `'${propKey}':`,
                        alt,
                    ])
                }
            }),
        })
    })
    if (!dirty) {
        propertyCodeCompletions.push({
            alternatives: [
                [' '],
            ],
        })

    }
    return createAlternativesProduct(propertyCodeCompletions)
}

function createCodeCompletionAlternativesForVerboseNode(node: def.NodeDefinition, keyProperty: def.PropertyDefinition | null): Alternatives {
    return {
        alternatives: createCodeCompletionForVerboseProperties(node, keyProperty).alternatives.map(alt => {
            return [' (', alt, ')']
        }),
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
                            serializeAlternatives(mergeAlternatives([
                                {
                                    alternatives: createCodeCompletionForShorthandNode($.annotation.nodeDefinition, $.annotation.keyProperty).alternatives.map(alt => {
                                        return [' <', alt, ' >']
                                    }),
                                },
                                createCodeCompletionAlternativesForVerboseNode($.annotation.nodeDefinition, $.annotation.keyProperty),
                            ]))
                        )
                        return createCodeCompletionForNodeGenerator(onToken)
                    },
                }
            }

            return createCodeCompletionForDictionaryGenerator(onToken)
        },
        onList: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onList",
            )

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

            return createCodeCompletionForListGenerator(onToken)
        },
        onTaggedUnion: $ => {
            if ($.annotation.annotation !== null) {
                onToken(
                    $.annotation.annotation,
                    null,
                    null,
                    //"onTaggedUnion",
                )
            }
            return {
                onUnexpectedOption: $$ => {
                    onToken(
                        $$.annotation.annotation,
                        null,
                        null,
                        //"onTaggedUnion",
                    )
                    //
                },
                onOption: $$ => {
                    onToken(
                        $$.annotation.annotation,
                        null,
                        null,
                        //"onTaggedUnion",
                    )
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
        onSimpleString: $ => {
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
        onMultilineString: $ => {
            onToken(
                $.annotation.annotation,
                null,
                null,
                //"onString",
            )
        },
        onComponent: () => {
            return createCodeCompletionForNodeGenerator(onToken)
        },
    }
}

function createCodeCompletionForNodeGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.NodeHandler<Annotation> {
    return {
        onShorthandTypeOpen: $ => {
            if ($.annotation.annotation !== null) {
                onToken(
                    $.annotation.annotation,
                    null,
                    serializeAlternatives(createCodeCompletionForShorthandNode(
                        $.annotation.nodeDefinition,
                        $.annotation.keyPropertyDefinition
                    )),
                    //"onShorthandTypeOpen",
                )
            }
            function createCodeCompletionForShorthandTypeGenerator<Annotation>(
                onToken: OnToken<Annotation>,
            ): streamVal.ShorthandTypeHandler<Annotation> {
                return {
                    onProperty: () => {
                        return createCodeCompletionsForPropertyGenerator(onToken)
                    },
                    onShorthandTypeClose: $ => {
                        if ($.annotation.annotation !== null) {
                            onToken(
                                $.annotation.annotation,
                                null,
                                null,
                                //"onShorthandTypeClose",
                            )
                        }
                    },
                }
            }

            return createCodeCompletionForShorthandTypeGenerator(onToken)
        },
        onVerboseTypeOpen: $ => {
            onToken(
                $.annotation.annotation,
                null,
                serializeAlternatives({
                    alternatives: createCodeCompletionForVerboseProperties($.annotation.nodeDefinition, $.annotation.keyPropertyDefinition).alternatives.map(alt => {
                        return [
                            '',
                            alt,
                            '',
                        ]
                    }),
                }),
                //"onVerboseTypeClose",
            )
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
                        )

                    },
                    onProperty: $ => {
                        onToken(
                            $.annotation.annotation,
                            null,
                            serializeAlternatives(createCodeCompletionForVerboseProperty($.annotation.definition)),
                        )
                        return createCodeCompletionsForPropertyGenerator(onToken)
                    },
                    onVerboseTypeClose: $ => {
                        onToken(
                            $.annotation.annotation,
                            null,
                            null,
                        )
                    },
                }
            }
            return createCodeCompletionForVerboseTypeGenerator(onToken)
        },
    }
}

export function createCodeCompletionsGenerator<Annotation>(
    onToken: OnToken<Annotation>,
    onEnd: () => void,
): streamVal.RootHandler<Annotation> {

    function createCodeCompletionGenerator(
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