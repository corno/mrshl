/* eslint
    "max-classes-per-file": off,
*/

import * as sideEffects from "../ParsingSideEffectsAPI"
import * as syncAPI from "../syncAPI"
import * as astn from "astn"
import * as fp from "fountain-pen"
import * as md from "../types"

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

export type OnToken = (
    range: astn.Range,
    getCodeCompletionsInToken: GetCodeCompletions | null,
    getCodeCompletionsAfterToken: GetCodeCompletions | null
) => void

class CodeCompletionGenerator implements sideEffects.Root {
    public readonly node: sideEffects.Node
    private readonly onEndCallback: () => void
    constructor(
        onToken: OnToken,
        onEnd: () => void,
    ) {
        this.node = new CodeCompletionForNodeGenerator(onToken)
        this.onEndCallback = onEnd
    }
    onEnd() {
        this.onEndCallback()
    }
}

class StateGroupCodeCompletionGenerator implements sideEffects.StateGroup {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onState() {
        return new CodeCompletionForNodeGenerator(this.onToken)
    }
    onUnexpectedState(
        _stateName: string,
        _tuRange: astn.Range,
        _tuPreData: astn.ContextData,
        optionRange: astn.Range,
        _optionPreData: astn.ContextData,
        stateGroupDefinition: md.StateGroup
    ) {
        this.onToken(
            optionRange,
            () => {
                return Object.keys(stateGroupDefinition.states.mapSorted(s => s))
            },
            null
        )
    }
}

class CodeCompletionForPropertyGenerator implements sideEffects.Property {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
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
        syncValue: syncAPI.Value,
        range: astn.Range,
        _data: astn.SimpleValueData,
        definition: md.Value,
    ) {
        this.onToken(
            range,
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

class CodeCompletionForListGenerator implements sideEffects.List {
    public readonly node: sideEffects.Node
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
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
    onUnexpectedEntry() {
        //
    }
}

class CodeCompletionForDictionaryGenerator implements sideEffects.Dictionary {
    public readonly node: sideEffects.Node
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
        this.node = new CodeCompletionForNodeGenerator(onToken)
    }
    onClose() {
        //
    }
    onUnexpectedEntry(
    ) {
        //
    }
    onEntry(
        range: astn.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property,
    ) {
        this.onToken(
            range,
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

class CodeCompletionForShorthandTypeGenerator implements sideEffects.ShorthandType {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onProperty(
        _propKey: string,
        _propDefinition: md.Property,
        _nodeBuilder: syncAPI.Node,
    ) {
        return new CodeCompletionForPropertyGenerator(this.onToken)
    }
    onShorthandTypeClose() {
        //
    }
}

class CodeCompletionForVerboseTypeGenerator implements sideEffects.Type {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onProperty(
        _propKey: string,
        propRange: astn.Range | null,
        propDefinition: md.Property,
        _nodeBuilder: syncAPI.Node,
    ) {
        if (propRange !== null) {
            this.onToken(
                propRange,
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
        }
        return new CodeCompletionForPropertyGenerator(this.onToken)
    }
    onUnexpectedProperty(
        _key: string,
        range: astn.Range,
        _preData: astn.ContextData,
        expectedProperties: string[]
    ) {
        this.onToken(
            range,
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

class CodeCompletionForNodeGenerator implements sideEffects.Node {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onShorthandTypeOpen(
        range: astn.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null
    ) {
        this.onToken(
            range,
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
        range: astn.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null
    ) {
        this.onToken(
            range,
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

export function createCodeCompletionsGenerator(
    onToken: OnToken,
    onEnd: () => void,
): sideEffects.Root {
    return new CodeCompletionGenerator(onToken, onEnd)
}