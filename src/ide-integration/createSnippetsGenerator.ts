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

type GetSnippets = () => string[]

function createPropertySnippet(prop: md.Property): fp.InlineSegment {
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

            return createNodeSnippet($.type.get().node, null)
        }
        case "state group": {
            const $ = prop.type[1]
            return [
                `| '${$["default state"].name}' `,
                createNodeSnippet($["default state"].get().node, null),
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

function createPropertiesSnippet(node: md.Node, keyProperty: md.Property | null): fp.Block {
    const x: fp.Block[] = []
    node.properties.mapUnsorted((prop, propKey) => {
        if (prop === keyProperty) {
            return
        }
        x.push(fp.line([
            `'${propKey}': `,
            createPropertySnippet(prop),
        ]))
    })
    return x
}

function createNodeSnippet(node: md.Node, keyProperty: md.Property | null): fp.InlineSegment {
    return [
        '(',
        () => {
            return createPropertiesSnippet(node, keyProperty)
        },
        ')',
    ]
}

export type OnToken = (
    range: astn.Range,
    getSnippetsInToken: GetSnippets | null,
    getSnippetsAfterToken: GetSnippets | null
) => void

class SnippetGenerator implements sideEffects.Root {
    public readonly node: sideEffects.Node
    private readonly onEndCallback: () => void
    constructor(
        onToken: OnToken,
        onEnd: () => void,
    ) {
        this.node = new NodeSnippetGenerator(onToken)
        this.onEndCallback = onEnd
    }
    onEnd() {
        this.onEndCallback()
    }
}

class StateGroupSnippetGenerator implements sideEffects.StateGroup {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onState() {
        return new NodeSnippetGenerator(this.onToken)
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

class PropertySnippetGenerator implements sideEffects.Property {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onDictionary() {
        return new DictionarySnippetGenerator(this.onToken)
    }
    onList() {
        return new ListSnippetGenerator(this.onToken)
    }
    onStateGroup() {
        return new StateGroupSnippetGenerator(this.onToken)
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
        return new NodeSnippetGenerator(this.onToken)
    }
}

class ListSnippetGenerator implements sideEffects.List {
    public readonly node: sideEffects.Node
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
        this.node = new NodeSnippetGenerator(onToken)
    }
    onClose() {
        //
    }
    onEntry() {
        return new NodeSnippetGenerator(this.onToken)
    }
    onUnexpectedEntry() {
        //
    }
}

class DictionarySnippetGenerator implements sideEffects.Dictionary {
    public readonly node: sideEffects.Node
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
        this.node = new NodeSnippetGenerator(onToken)
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
                            createNodeSnippet(nodeDefinition, keyPropertyDefinition),
                        ]),
                    ],
                    "    ",
                    true,
                    snippet => {
                        out.push(snippet)
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
        return new NodeSnippetGenerator(this.onToken)
    }
}

class NodeSnippetGenerator implements sideEffects.Node {
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
        propRange: astn.Range,
        propDefinition: md.Property,
        _nodeBuilder: syncAPI.Node,
    ) {
        this.onToken(
            propRange,
            null,
            () => {
                const out: string[] = []
                fp.serialize(
                    [
                        fp.line([
                            " ",
                            createPropertySnippet(propDefinition),
                        ]),
                    ],
                    "    ",
                    true,
                    snippet => {
                        out.push(snippet)
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
        return new PropertySnippetGenerator(this.onToken)
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
                            return createPropertiesSnippet(nodeDefinition, keyPropertyDefinition)
                        },
                        '',
                    ],
                    "    ",
                    true,
                    snippet => {
                        out.push(snippet)
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

export function createSnippetsGenerator(
    onToken: OnToken,
    onEnd: () => void,
): sideEffects.Root {
    return new SnippetGenerator(onToken, onEnd)
}