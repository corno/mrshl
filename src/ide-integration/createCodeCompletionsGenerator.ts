/* eslint
    "max-classes-per-file": off,
*/

import * as astncore from "astn-core"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}
function cc<T>(input: T, callback: (output: T) => void): void {
    callback(input)
}

type GetCodeCompletions = () => string[]
interface AlternativesRoot {
    root: Line
    serialize: () => string[]
}

interface Step {
    addOption: () => Line
}

interface Block {
    addLine: () => Line
}

interface Line {
    snippet(str: string): void
    indent(callback: ($: Block) => void): void
    addTaggedUnionStep: () => Step
}

function createCodeCompletionForProperty(
    prop: astncore.PropertyDefinition,
    sequence: Line,
    onComponent: (def: astncore.ComponentDefinition) => void,
    onTaggedUnion: (def: astncore.TaggedUnionDefinition) => void,
): void {
    switch (prop.type[0]) {
        case "dictionary": {
            sequence.snippet(` { }`)
            break
        }
        case "list": {
            sequence.snippet(` [ ]`)
            break
        }
        case "component": {
            const $ = prop.type[1]
            onComponent($)
            break
        }
        case "tagged union": {
            const $ = prop.type[1]
            onTaggedUnion($)
            break
        }
        case "simple string": {
            const $ = prop.type[1]
            if ($.quoted) {
                sequence.snippet(` "${$["default value"]}"`)
            } else {
                sequence.snippet(` ${$["default value"]}`)
            }
            break
        }
        case "multiline string": {
            //const $ = prop.type[1]
            sequence.snippet(` \`\``)
            break
        }
        default:
            assertUnreachable(prop.type[0])
    }
}

function createCodeCompletionForShorthandNode(
    node: astncore.NodeDefinition,
    sequence: Line,
): void {

    node.properties.forEach((prop, _propKey) => {
        createCodeCompletionForProperty(
            prop,
            sequence,
            $ => {
                createCodeCompletionForShorthandNode($.type.get().node, sequence)
            },
            $ => {
                const step = sequence.addTaggedUnionStep()
                $.options.forEach((option, optionName) => {
                    const seq = step.addOption()
                    seq.snippet(` '${optionName}'`)
                    createCodeCompletionForShorthandNode(option.node, seq)
                })
            },
        )
    })
}

function createCodeCompletionForVerboseProperty(prop: astncore.PropertyDefinition, sequence: Line): void {
    createCodeCompletionForProperty(
        prop,
        sequence,
        $ => {
            createCodeCompletionAlternativesForVerboseNode($.type.get().node, sequence)
        },
        $ => {
            sequence.snippet(` | '${$["default option"].name}'`)
            createCodeCompletionAlternativesForVerboseNode($["default option"].get().node, sequence)
        },
    )
}

function createCodeCompletionForVerboseProperties(
    node: astncore.NodeDefinition,
    sequence: Line,
): void {
    let dirty = false
    sequence.indent($ => {
        node.properties.forEach((prop, propKey) => {
            dirty = true
            const line = $.addLine()
            line.snippet(`'${propKey}':`)
            createCodeCompletionForVerboseProperty(prop, line)
        })
    })
    if (!dirty) {
        sequence.snippet(' ')
    }
}

function createCodeCompletionAlternativesForVerboseNode(
    node: astncore.NodeDefinition,
    sequence: Line,
): void {
    sequence.snippet(` (`)
    createCodeCompletionForVerboseProperties(node, sequence)
    sequence.snippet(`)`)
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
        type StepType =
            | ["block", {
                block: ABlock
            }]
            | ["snippet", {
                value: string
            }]
            | ["tagged union", {
                "alts": ASequence[]
            }]
        type ASequence = StepType[]

        type ABlock = {
            lines: ASequence[]
        }

        const rootSequence: ASequence = []

        function createBlock(imp: ABlock): Block {
            return {
                addLine: () => {
                    const seq: ASequence = []
                    imp.lines.push(seq)
                    return createSequence(seq)
                },
            }
        }

        function createSequence(imp: ASequence): Line {
            return {
                indent: callback => {
                    const block: ABlock = {
                        lines: [],
                    }
                    imp.push(["block", {
                        block: block,
                    }])
                    callback(createBlock(block))
                },
                snippet: (str: string) => {
                    imp.push(["snippet", { value: str }])
                },
                addTaggedUnionStep: () => {
                    function createStep(sequence: ASequence): Step {
                        const alts: ASequence[] = []
                        sequence.push(["tagged union", { alts: alts }])
                        return {
                            addOption: () => {
                                const subSeq: ASequence = []
                                alts.push(subSeq)
                                return createSequence(subSeq)
                            },
                        }
                    }
                    return createStep(imp)
                },
            }
        }

        return {
            root: createSequence(rootSequence),
            serialize: () => {
                let indentationLevel = 0
                function createIndentation() {
                    let str = ""
                    for (let i = 0; i!== indentationLevel; i+=1) {
                        str += "    "
                    }
                    return str
                }
                function ser(seed: string[], s: ASequence, add: (str: string) => void): void {
                    let out = seed
                    for (let i = 0; i !== s.length; i += 1) {
                        const step = s[i]
                        switch (step[0]) {
                            case "block":
                                cc(step[1], step => {
                                    indentationLevel += 1
                                    step.block.lines.forEach(l => {
                                        const temp: string[] = []
                                        ser(out.map(str => `${str}\n${createIndentation()}`), l, str => temp.push(str))
                                        out = temp
                                    })
                                    indentationLevel -= 1
                                    if (step.block.lines.length !== 0) {
                                        out = out.map(str => `${str}\n${createIndentation()}`)
                                    }
                                    //
                                })
                                break
                            case "snippet":
                                cc(step[1], step => {
                                    out = out.map(str => {
                                        return str + step.value
                                    })
                                })
                                break
                            case "tagged union":
                                cc(step[1], step => {
                                    const temp: string[] = []
                                    for (let j = 0; j !== step.alts.length; j += 1) {
                                        const alt = step.alts[j]
                                        ser(out, alt, str => temp.push(str))
                                    }
                                    out = temp
                                })
                                break
                            default:
                                assertUnreachable(step[0])
                        }
                    }

                    out.forEach(str => {
                        add(str)
                    })
                }
                const res: string[] = []
                ser([""], rootSequence, str => res.push(str))
                return res
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
                        const shorthandAlternatives = createAlternativesRoot()
                        shorthandAlternatives.root.snippet(` <`)
                        createCodeCompletionForShorthandNode($.annotation.nodeDefinition, shorthandAlternatives.root)
                        shorthandAlternatives.root.snippet(` >`)

                        const verboseAlternatives = createAlternativesRoot()
                        createCodeCompletionAlternativesForVerboseNode($.annotation.nodeDefinition, verboseAlternatives.root)

                        const alts = shorthandAlternatives.serialize().concat(verboseAlternatives.serialize())

                        onToken(
                            $.annotation.annotation,
                            null,
                            () => alts
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
                createCodeCompletionForShorthandNode(
                    $.annotation.nodeDefinition,
                    alternatives.root,
                )
                return () => alternatives.serialize()
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
            createCodeCompletionForVerboseProperties($.annotation.nodeDefinition, alternatives.root)
            onToken(
                $.annotation.annotation,
                null,
                () => {
                    return alternatives.serialize()
                },
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
                        createCodeCompletionForVerboseProperty($.annotation.definition, alternatives.root)
                        onToken(
                            $.annotation.annotation,
                            null,
                            () => alternatives.serialize(),
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