import { SideEffectsAPI, GenerateSnippets } from "./deserialize"
import * as ds from "./datasetAPI"
import * as bc from "bass-clarinet"
import * as fp from "fountain-pen"
import * as md from "./metaDataSchema"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

export type RegisterSnippet = (range: bc.Range, intraSnippetGenerator: GenerateSnippets | null, snippetAfterGenerator: GenerateSnippets | null) => void

function createPropertySnippet(prop: md.Property, propName: string, nodeBuilder: ds.NodeBuilder): fp.InlinePart {
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

            return createNodeSnippet($.type.get().node, null, nodeBuilder.getComponent(propName).node)
        }
        case "state group": {
            //const $ = prop.type[1]
            return `| '' ()`
        }
        case "value": {
            //const $ = prop.type[1]
            return `"${""}"`
        }
        default:
            return assertUnreachable(prop.type[0])
    }
}

function createPropertiesSnippet(node: md.Node, keyProperty: md.Property | null, nodeBuilder: ds.NodeBuilder): fp.IParagraph {
    const x: fp.ParagraphPart[] = []
    node.properties.map((prop, propKey) => {
        if (prop === keyProperty) {
            return
        }
        x.push(fp.line([
            `'${propKey}': `,
            createPropertySnippet(prop, propKey, nodeBuilder),
        ]))
    })
    return x
}

function createNodeSnippet(node: md.Node, keyProperty: md.Property | null, nodeBuilder: ds.NodeBuilder): fp.InlinePart {
    return [
        '(',
        () => {
            return createPropertiesSnippet(node, keyProperty, nodeBuilder)
        },
        ')',
    ]
}

export class SnippetGenerator implements SideEffectsAPI {
    private readonly registerSnippet: RegisterSnippet
    constructor(registerSnippet: RegisterSnippet) {
        this.registerSnippet = registerSnippet
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
        entry: ds.DictionaryEntry,
    ) {
        this.registerSnippet(
            entryData.keyRange,
            null,
            () => {
                const out: string[] = []
                fp.serialize(
                    [createNodeSnippet(nodeDefinition, keyPropertyDefinition, entry.node)], "    ", true, snippet => {
                        out.push(snippet)
                    })
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
    }
    onDictionaryOpen() {
        //
    }
    onListClose() {
        //
    }
    onListOpen() {
        //
    }
    onListEntry() {
        //
    }
    onProperty(
        propertyData: bc.PropertyData,
        propKey: string,
        propDefinition: md.Property,
        nodeBuilder: ds.NodeBuilder,
    ) {
        this.registerSnippet(
            propertyData.keyRange,
            null,
            () => {
                const out: string[] = []
                fp.serialize(
                    [createPropertySnippet(propDefinition, propKey, nodeBuilder)], "    ", true, snippet => {
                        out.push(snippet)
                    })
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
        this.registerSnippet(
            metaData.keyRange,
            () => {
                return expectedProperties
            },
            null
        )
    }
    onState() {
        //
    }
    onTypeOpen(range: bc.Range, nodeDefinition: md.Node, keyPropertyDefinition: md.Property | null, nodeBuilder: ds.NodeBuilder) {
        this.registerSnippet(
            range,
            null,
            () => {
                const out: string[] = []
                fp.serialize(
                    [
                        '',
                        () => {
                            return createPropertiesSnippet(nodeDefinition, keyPropertyDefinition, nodeBuilder)
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
        tuData: bc.TaggedUnionData,
        _beginPreData: bc.PreData,
        _optionPreData: bc.PreData,
        stateGroupDefinition: md.StateGroup
    ) {
        this.registerSnippet(
            tuData.optionRange,
            () => {
                return Object.keys(stateGroupDefinition.states.map(s => s))
            },
            null
        )
    }
    onValue(data: bc.StringData, value: ds.Value) {
        this.registerSnippet(
            data.range,
            () => {
                return value.getSuggestions()
            },
            null,
        )
    }
}