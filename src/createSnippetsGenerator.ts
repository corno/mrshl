import * as sideEffects from "./SideEffectsAPI"
import * as syncAPI from "./syncAPI"
import * as bc from "bass-clarinet"
import * as fp from "fountain-pen"
import * as md from "./metaDataSchema"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type GetSnippets = () => string[]

function createPropertySnippet(prop: md.Property): fp.InlinePart {
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

function createPropertiesSnippet(node: md.Node, keyProperty: md.Property | null): fp.IParagraph {
    const x: fp.ParagraphPart[] = []
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

function createNodeSnippet(node: md.Node, keyProperty: md.Property | null): fp.InlinePart {
    return [
        '(',
        () => {
            return createPropertiesSnippet(node, keyProperty)
        },
        ')',
    ]
}

export type OnToken = (
    range: bc.Range,
    getSnippetsInToken: GetSnippets | null,
    getSnippetsAfterToken: GetSnippets | null
) => void

class SnippetGenerator implements sideEffects.Node, sideEffects.Dictionary, sideEffects.Root {
    public node: sideEffects.Node
    private readonly onToken: OnToken
    private readonly onEndCallback: () => void
    constructor(
        onToken: OnToken,
        onEnd: () => void,
    ) {
        this.onToken = onToken
        this.node = this
        this.onEndCallback = onEnd
    }
    onEnd() {
        this.onEndCallback()
    }
    onArrayTypeClose() {
        //
    }
    onArrayTypeOpen() {
        //
    }
    onDictionaryClose() {
        //
    }
    onUnexpectedDictionaryEntry(
        _entryData: bc.PropertyData,
    ) {
        //
    }
    onDictionaryEntry(
        entryData: bc.PropertyData,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property,
    ) {
        this.onToken(
            entryData.keyRange,
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
                    //return preData.indentation + line
                }).join("\n")]
            }
        )
        return this
    }
    onDictionaryOpen() {
        return this
    }
    onListClose() {
        //
    }
    onListOpen() {
        return this
    }
    onListEntry() {
        return this
    }
    onUnexpectedListEntry() {
        //
    }
    onProperty(
        propertyData: bc.PropertyData,
        _propKey: string,
        propDefinition: md.Property,
        _nodeBuilder: syncAPI.Node,
    ) {
        this.onToken(
            propertyData.keyRange,
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
                    //return preData.indentation + line
                }).join("\n")]
            },
        )
    }
    onUnexpectedProperty(_key: string, metaData: bc.PropertyData, _preData: bc.PreData, expectedProperties: string[]) {
        this.onToken(
            metaData.keyRange,
            () => {
                return expectedProperties
            },
            null
        )
    }
    onState() {
        return this
    }
    onTypeOpen(range: bc.Range, nodeDefinition: md.Node, keyPropertyDefinition: md.Property | null) {
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
                        //return preData.indentation + line
                    }).join("\n"),
                ]
            },
        )
    }
    onTypeClose() {
        //
    }
    onUnexpectedState(
        _stateName: string,
        _tuData: bc.SimpleMetaData,
        _beginPreData: bc.PreData,
        optionData: bc.SimpleMetaData,
        _optionPreData: bc.PreData,
        stateGroupDefinition: md.StateGroup
    ) {
        this.onToken(
            optionData.range,
            () => {
                return Object.keys(stateGroupDefinition.states.mapUnsorted(s => s))
            },
            null
        )
    }
    onValue(_propertyName: string, data: bc.StringData, value: syncAPI.Value, definition: md.Value) {
        this.onToken(
            data.range,
            () => {
                return value.getSuggestions().map(sugg => {
                    return definition.quoted ? `"${sugg}"` : sugg
                })
            },
            null,
        )
    }
    onComponent() {
        return this
    }
}

export function createSnippetsGenerator(
    onToken: OnToken,
    onEnd: () => void,
    ): sideEffects.Root {
    return new SnippetGenerator(onToken, onEnd)
}