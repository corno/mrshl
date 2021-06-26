/* eslint
    "max-classes-per-file": off,
*/

import * as astncore from "astn-core"
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

interface AlternativesRoot {
    root: AlternativesAPI
    serialize: () => void
}

interface AlternativesAPI {
    addLeaf(str: string): void
    addProduct: () => AlternativesProductAPI
}

interface AlternativesProductAPI {
    branch: () => AlternativesAPI
    end: () => void
}

function createLeaf(str: string, alternatives: AlternativesAPI): Alternatives {
    alternatives.addLeaf(str)
    return {
        alternatives: [
            str,
        ],
    }
}

function createCodeCompletionForProperty(
    prop: astncore.PropertyDefinition,
    onComponent: (def: astncore.ComponentDefinition) => Alternatives,
    onTaggedUnion: (def: astncore.TaggedUnionDefinition) => Alternatives,
    alternatives: AlternativesAPI,
): Alternatives {
    switch (prop.type[0]) {
        case "dictionary": {
            return createLeaf(` { }`, alternatives)
        }
        case "list": {
            return createLeaf(` [ ]`, alternatives)
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
                return createLeaf(` "${$["default value"]}"`, alternatives)
            } else {
                return createLeaf(` ${$["default value"]}`, alternatives)
            }
        }
        case "multiline string": {
            //const $ = prop.type[1]
            return createLeaf(` \`\``, alternatives)
        }
        default:
            return assertUnreachable(prop.type[0])
    }
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
    node: astncore.NodeDefinition,
    alternatives: AlternativesAPI,
): Alternatives {
    const propertyCodeCompletions: Alternatives[] = []

    const product = alternatives.addProduct()
    node.properties.forEach((prop, _propKey) => {
        function createCodeCompletionForShorthandProperty(
            prop: astncore.PropertyDefinition,
            alternatives: AlternativesAPI,
        ): Alternatives {
            return createCodeCompletionForProperty(
                prop,
                $ => {
                    return createCodeCompletionForShorthandNode($.type.get().node, alternatives)
                },
                $ => {
                    return mergeAlternatives($.options.toArray((option, optionName) => {
                        const ccsh = createCodeCompletionForShorthandNode(option.node, alternatives)
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
                alternatives,
            )
        }
        propertyCodeCompletions.push(createCodeCompletionForShorthandProperty(prop, product.branch()))
    })
    product.end()
    return createAlternativesProduct(propertyCodeCompletions)
}

function createCodeCompletionForVerboseProperty(prop: astncore.PropertyDefinition, alternatives: AlternativesAPI): Alternatives {
    return createCodeCompletionForProperty(
        prop,
        $ => {
            return createCodeCompletionAlternativesForVerboseNode($.type.get().node, alternatives)
        },
        $ => {
            const ccvh = createCodeCompletionAlternativesForVerboseNode($["default option"].get().node, alternatives)
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
        alternatives,
    )
}

function createCodeCompletionForVerboseProperties(
    node: astncore.NodeDefinition,
    alternatives: AlternativesAPI,
): Alternatives {
    const propertyCodeCompletions: Alternatives[] = []
    const product = alternatives.addProduct()
    let dirty = false
    node.properties.forEach((prop, propKey) => {
        dirty = true
        propertyCodeCompletions.push({
            alternatives: createCodeCompletionForVerboseProperty(prop, product.branch()).alternatives.map(alt => {
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

function createCodeCompletionAlternativesForVerboseNode(node: astncore.NodeDefinition, alternatives: AlternativesAPI): Alternatives {
    return {
        alternatives: createCodeCompletionForVerboseProperties(node, alternatives).alternatives.map(alt => {
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
): astncore.TypedValueHandler<Annotation> {

    function createAlternativesRoot(): AlternativesRoot {
        function createAlternativesAPI(): AlternativesAPI {
            return {
                addLeaf: () => {
                    //
                },
                addProduct: () => {
                    return createAlternativesProductAPI()
                },
            }
        }

        function createAlternativesProductAPI(): AlternativesProductAPI {
            return {
                branch: () => {
                    return createAlternativesAPI()
                },
                end: () => {
                    //
                },
            }
        }
        return {
            root: createAlternativesAPI(),
            serialize: () => {
                //
            },
        }
    }

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
            ): astncore.DictionaryHandler<Annotation> {
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
                        const alternatives = createAlternativesRoot()
                        onToken(
                            $.annotation.annotation,
                            null,
                            serializeAlternatives(mergeAlternatives([
                                {
                                    alternatives: createCodeCompletionForShorthandNode($.annotation.nodeDefinition, alternatives.root).alternatives.map(alt => {
                                        return [' <', alt, ' >']
                                    }),
                                },
                                createCodeCompletionAlternativesForVerboseNode($.annotation.nodeDefinition, alternatives.root),
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
            ): astncore.ListHandler<Annotation> {
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
                const alternatives = createAlternativesRoot()
                return serializeAlternatives(createCodeCompletionForShorthandNode(
                    $.annotation.nodeDefinition,
                    alternatives.root,
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
            ): astncore.ShorthandTypeHandler<Annotation> {
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
            const alternatives = createAlternativesRoot()
            onToken(
                $.annotation.annotation,
                null,
                serializeAlternatives({
                    alternatives: createCodeCompletionForVerboseProperties($.annotation.nodeDefinition, alternatives.root).alternatives.map(alt => {
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
            ): astncore.VerboseTypeHandler<Annotation> {
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
                        const alternatives = createAlternativesRoot()
                        onToken(
                            $.annotation.annotation,
                            null,
                            serializeAlternatives(createCodeCompletionForVerboseProperty($.annotation.definition, alternatives.root)),
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
): astncore.RootHandler<Annotation> {

    function createCodeCompletionGenerator(
        onToken: OnToken<Annotation>,
        onEnd2: () => void,
    ): astncore.RootHandler<Annotation> {
        return {
            root: createCodeCompletionsForValueGenerator<Annotation>(onToken),
            onEnd: () => {
                onEnd2()
            },
        }
    }

    return createCodeCompletionGenerator(onToken, onEnd)
}