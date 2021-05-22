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

function createPropertyCodeCompletion(prop: md.Property): fp.InlineSegment {
    switch (prop.type[0]) {
        case "collection": {
            const $ = prop.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    return `{}`
                }
                case "list": {
                    return `[]`
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = prop.type[1]

            return createNodeCodeCompletion($.type.get().node, null)
        }
        case "state group": {
            const $ = prop.type[1]
            return [
                `| '${$["default state"].name}' `,
                createNodeCodeCompletion($["default state"].get().node, null),
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

function createPropertiesCodeCompletion(node: md.Node, keyProperty: md.Property | null): fp.Block {
    const x: fp.Block[] = []
    node.properties.mapUnsorted((prop, propKey) => {
        if (prop === keyProperty) {
            return
        }
        x.push(fp.line([
            `'${propKey}': `,
            createPropertyCodeCompletion(prop),
        ]))
    })
    return x
}

function createNodeCodeCompletion(node: md.Node, keyProperty: md.Property | null): fp.InlineSegment {
    return [
        '(',
        () => {
            return createPropertiesCodeCompletion(node, keyProperty)
        },
        ')',
    ]
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
        this.node = new NodeCodeCompletionGenerator(onToken)
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
        return new NodeCodeCompletionGenerator(this.onToken)
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
                return Object.keys(stateGroupDefinition.states.mapUnsorted(s => s))
            },
            null
        )
    }
}

class PropertyCodeCompletionGenerator implements sideEffects.Property {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onDictionary() {
        return new DictionaryCodeCompletionGenerator(this.onToken)
    }
    onList() {
        return new ListCodeCompletionGenerator(this.onToken)
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
        return new NodeCodeCompletionGenerator(this.onToken)
    }
}

class ListCodeCompletionGenerator implements sideEffects.List {
    public readonly node: sideEffects.Node
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
        this.node = new NodeCodeCompletionGenerator(onToken)
    }
    onClose() {
        //
    }
    onEntry() {
        return new NodeCodeCompletionGenerator(this.onToken)
    }
    onUnexpectedEntry() {
        //
    }
}

class DictionaryCodeCompletionGenerator implements sideEffects.Dictionary {
    public readonly node: sideEffects.Node
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
        this.node = new NodeCodeCompletionGenerator(onToken)
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
                const out: string[] = []
                fp.serialize(
                    [
                        fp.line([
                            " ",
                            createNodeCodeCompletion(nodeDefinition, keyPropertyDefinition),
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
            }
        )
        return new NodeCodeCompletionGenerator(this.onToken)
    }
}

class NodeCodeCompletionGenerator implements sideEffects.Node {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onShorthandTypeClose() {
        //
    }
    onShorthandTypeOpen() {
        //
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
                                createPropertyCodeCompletion(propDefinition),
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
        return new PropertyCodeCompletionGenerator(this.onToken)
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
    onTypeOpen(range: astn.Range, nodeDefinition: md.Node, keyPropertyDefinition: md.Property | null) {
        this.onToken(
            range,
            null,
            () => {
                const out: string[] = []
                fp.serialize(
                    [
                        '',
                        () => {
                            return createPropertiesCodeCompletion(nodeDefinition, keyPropertyDefinition)
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
                    out.map((line, index) => {
                        //don't indent the first line
                        if (index === 0) {
                            return line
                        }
                        return line
                        //return contextData.indentation + line
                    }).join("\n"),
                ]
            },
        )
    }
    onTypeClose() {
        //
    }
}

export function createCodeCompletionsGenerator(
    onToken: OnToken,
    onEnd: () => void,
): sideEffects.Root {
    return new CodeCompletionGenerator(onToken, onEnd)
}