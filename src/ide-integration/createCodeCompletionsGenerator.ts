/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../deserialize/interfaces/streamingValidationAPI"
import * as def from "../deserialize/interfaces/typedParserDefinitions"
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
        false,
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
        case "dictionary": {
            return createLeaf(` { }`)
        }
        case "list": {
            return createLeaf(` [ ]`)
        }
        case "component": {
            const $ = prop.type[1]
            return onComponent($)
        }
        case "tagged union": {
            const $ = prop.type[1]
            return onTaggedUnion($)
        }
        case "simple string": {
            const $ = prop.type[1]
            if ($.quoted) {
                return createLeaf(` "${$["default value"]}"`)
            } else {
                return createLeaf(` ${$["default value"]}`)
            }
        }
        case "multiline string": {
            //const $ = prop.type[1]
            return createLeaf(` \`\``)
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
            return createCodeCompletionForShorthandNode($.type.get().node)
        },
        $ => {
            return mergeAlternatives($.options.toArray((option, optionName) => {
                const ccsh = createCodeCompletionForShorthandNode(option.node)
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
): Alternatives {
    const propertyCodeCompletions: Alternatives[] = []
    node.properties.forEach((prop, _propKey) => {
        propertyCodeCompletions.push(createCodeCompletionForShorthandProperty(prop))
    })
    return createAlternativesProduct(propertyCodeCompletions)
}

function createCodeCompletionForVerboseProperty(prop: def.PropertyDefinition): Alternatives {
    return createCodeCompletionForProperty(
        prop,
        $ => {
            return createCodeCompletionAlternativesForVerboseNode($.type.get().node)
        },
        $ => {
            const ccvh = createCodeCompletionAlternativesForVerboseNode($["default option"].get().node)
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

function createCodeCompletionForVerboseProperties(node: def.NodeDefinition): Alternatives {
    const propertyCodeCompletions: Alternatives[] = []
    let dirty = false
    node.properties.forEach((prop, propKey) => {
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

function createCodeCompletionAlternativesForVerboseNode(node: def.NodeDefinition): Alternatives {
    return {
        alternatives: createCodeCompletionForVerboseProperties(node).alternatives.map(alt => {
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


function createCodeCompletionsForValueGenerator<Annotation>(
    onToken: OnToken<Annotation>,
): streamVal.ValueHandler<Annotation> {
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
                                    alternatives: createCodeCompletionForShorthandNode($.annotation.nodeDefinition).alternatives.map(alt => {
                                        return [' <', alt, ' >']
                                    }),
                                },
                                createCodeCompletionAlternativesForVerboseNode($.annotation.nodeDefinition),
                            ]))
                        )
                        return createCodeCompletionsForValueGenerator(onToken)
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
                        return createCodeCompletionsForValueGenerator(onToken)
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
                        () => {
                            return $.annotation.definition.options.getKeys()
                        },
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
                    return createCodeCompletionsForValueGenerator(onToken)
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
                    return $.annotation.getSuggestions().map(sugg => {
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
            return createCodeCompletionsForValueGenerator(onToken)
        },
        onShorthandTypeOpen: $ => {
            function serialize() {
                return serializeAlternatives(createCodeCompletionForShorthandNode(
                    $.annotation.nodeDefinition,
                ))
            }
            if ($.annotation.annotation !== null) {
                onToken(
                    $.annotation.annotation,
                    null,
                    serialize(),
                    //"onShorthandTypeOpen",
                )
            }
            function createCodeCompletionForShorthandTypeGenerator<Annotation>(
                onToken: OnToken<Annotation>,
            ): streamVal.ShorthandTypeHandler<Annotation> {
                return {
                    onProperty: () => {
                        return createCodeCompletionsForValueGenerator(onToken)
                    },
                    onShorthandTypeClose: $$ => {
                        if ($$.annotation.annotation !== null) {
                            onToken(
                                $$.annotation.annotation,
                                serialize(),
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
                    alternatives: createCodeCompletionForVerboseProperties($.annotation.nodeDefinition).alternatives.map(alt => {
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
                        return createCodeCompletionsForValueGenerator(onToken)
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
            root: createCodeCompletionsForValueGenerator<Annotation>(onToken),
            onEnd: () => {
                onEnd2()
            },
        }
    }

    return createCodeCompletionGenerator(onToken, onEnd)
}