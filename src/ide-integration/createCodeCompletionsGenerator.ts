/* eslint
    "max-classes-per-file": off,
*/

import * as sideEffects from "../API/ParsingSideEffectsAPI"
import * as syncAPI from "../API/syncAPI"
import * as astn from "astn"
import * as fp from "fountain-pen"
import * as md from "../API/types"

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

class CodeCompletionGenerator<Annotation> implements sideEffects.Root<Annotation> {
    public readonly node: sideEffects.Node<Annotation>
    private readonly onEndCallback: () => void
    constructor(
        onToken: OnToken<Annotation>,
        onEnd: () => void,
    ) {
        this.node = new CodeCompletionForNodeGenerator<Annotation>(onToken)
        this.onEndCallback = onEnd
    }
    onEnd() {
        this.onEndCallback()
    }
}

class StateGroupCodeCompletionGenerator<Annotation> implements sideEffects.StateGroup<Annotation> {
    private readonly onToken: OnToken<Annotation>
    constructor(
        onToken: OnToken<Annotation>,
    ) {
        this.onToken = onToken
    }
    onState() {
        return new CodeCompletionForNodeGenerator(this.onToken)
    }
    onUnexpectedState(
        data: astn.OptionData<Annotation>,
        // _stateName: string,
        // _tuRange: astn.Range,
        // _tuPreData: astn.ContextData,
        // optionRange: astn.Range,
        // _optionPreData: astn.ContextData,
        stateGroupDefinition: md.StateGroup
    ) {
        this.onToken(
            data.annotation,
            () => {
                return Object.keys(stateGroupDefinition.states.mapSorted(s => s))
            },
            null
        )
    }
}

class CodeCompletionForPropertyGenerator<Annotation> implements sideEffects.Property<Annotation> {
    private readonly onToken: OnToken<Annotation>
    constructor(
        onToken: OnToken<Annotation>,
    ) {
        this.onToken = onToken
    }
    onDictionary() {
        return new CodeCompletionForDictionaryGenerator(this.onToken)
    }
    onList() {
        return new CodeCompletionForListGenerator(this.onToken)
    }
    onStateGroup() {
        return new StateGroupCodeCompletionGenerator(this.onToken)
    }
    onNull() {
        //
    }
    onValue(
        data: astn.SimpleValueData2<Annotation>,
        syncValue: syncAPI.Value,
        definition: md.Value,
    ) {
        this.onToken(
            data.annotation,
            () => {
                return syncValue.getSuggestions().map(sugg => {
                    return definition.quoted ? `"${sugg}"` : sugg
                })
            },
            null,
        )
    }
    onComponent() {
        return new CodeCompletionForNodeGenerator(this.onToken)
    }
}

class CodeCompletionForListGenerator<Annotation> implements sideEffects.List<Annotation> {
    public readonly node: sideEffects.Node<Annotation>
    private readonly onToken: OnToken<Annotation>
    constructor(
        onToken: OnToken<Annotation>,
    ) {
        this.onToken = onToken
        this.node = new CodeCompletionForNodeGenerator(onToken)
    }
    onClose() {
        //
    }
    onEntry() {
        return new CodeCompletionForNodeGenerator(this.onToken)
    }
}

class CodeCompletionForDictionaryGenerator<Annotation> implements sideEffects.Dictionary<Annotation> {
    public readonly node: sideEffects.Node<Annotation>
    private readonly onToken: OnToken<Annotation>
    constructor(
        onToken: OnToken<Annotation>,
    ) {
        this.onToken = onToken
        this.node = new CodeCompletionForNodeGenerator(onToken)
    }
    onClose() {
        //
    }
    onEntry(
        data: astn.PropertyData<Annotation>,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property,
    ) {
        this.onToken(
            data.annotation,
            null,
            () => {
                function create(shorthand: boolean) {
                    const out: string[] = []
                    fp.serialize(
                        [
                            fp.line([
                                " ",
                                createCodeCompletionForNode(nodeDefinition, keyPropertyDefinition, shorthand),
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
        return new CodeCompletionForNodeGenerator(this.onToken)
    }
}

class CodeCompletionForShorthandTypeGenerator<Annotation> implements sideEffects.ShorthandType<Annotation> {
    private readonly onToken: OnToken<Annotation>
    constructor(
        onToken: OnToken<Annotation>,
    ) {
        this.onToken = onToken
    }
    onProperty(
        // _propKey: string,
        // _propDefinition: md.Property,
        // _nodeBuilder: syncAPI.Node,
    ) {
        return new CodeCompletionForPropertyGenerator(this.onToken)
    }
    onShorthandTypeClose() {
        //
    }
}

class CodeCompletionForVerboseTypeGenerator<Annotation> implements sideEffects.Type<Annotation> {
    private readonly onToken: OnToken<Annotation>
    constructor(
        onToken: OnToken<Annotation>,
    ) {
        this.onToken = onToken
    }
    onProperty(
        data: astn.PropertyData<Annotation>,
        // _propKey: string,
        // propRange: astn.Range | null,
        propDefinition: md.Property,
        // _nodeBuilder: syncAPI.Node,
    ) {
        this.onToken(
            data.annotation,
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
        return new CodeCompletionForPropertyGenerator(this.onToken)
    }
    onUnexpectedProperty(
        data: astn.PropertyData<Annotation>,
        expectedProperties: string[]
    ) {
        this.onToken(
            data.annotation,
            () => {
                return expectedProperties
            },
            null
        )
    }
    onTypeClose() {
        //
    }
}

class CodeCompletionForNodeGenerator<Annotation> implements sideEffects.Node<Annotation> {
    private readonly onToken: OnToken<Annotation>
    constructor(
        onToken: OnToken<Annotation>,
    ) {
        this.onToken = onToken
    }
    onShorthandTypeOpen(
        data: astn.ArrayBeginData<Annotation>,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null
    ) {
        this.onToken(
            data.annotation,
            null,
            () => {
                const out: string[] = []
                fp.serialize(
                    [
                        fp.line(createCodeCompletionForShorthandProperties(nodeDefinition, keyPropertyDefinition)),
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
        return new CodeCompletionForShorthandTypeGenerator(this.onToken)
    }
    onTypeOpen(
        data: astn.ObjectBeginData<Annotation>,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null
    ) {
        this.onToken(
            data.annotation,
            null,
            () => {
                const out: string[] = []
                fp.serialize(
                    [
                        '',
                        () => {
                            return createCodeCompletionForVerboseProperties(nodeDefinition, keyPropertyDefinition)
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
        return new CodeCompletionForVerboseTypeGenerator(this.onToken)
    }
}

export function createCodeCompletionsGenerator<Annotation>(
    onToken: OnToken<Annotation>,
    onEnd: () => void,
): sideEffects.Root<Annotation> {
    return new CodeCompletionGenerator(onToken, onEnd)
}