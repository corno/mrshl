import * as bc from "bass-clarinet"
import * as fp from "fountain-pen"
import * as md from "../metaDataSchema"
import { NodeBuilder } from "../builderAPI"
import { RegisterSnippetsGenerators } from "./registerSnippetGenerators"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function createPropertySnippet(prop: md.Property, propName: string, nodeBuilder: NodeBuilder): fp.InlinePart {
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

            return createNodeSnippet($.type.get().node, nodeBuilder.setComponent(propName).node)
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

function createPropertiesSnippet(node: md.Node, nodeBuilder: NodeBuilder): fp.IParagraph {
    const x: fp.ParagraphPart[] = []
    node.properties.map((prop, propKey) => {
        x.push(fp.line([
            `'${propKey}': `,
            createPropertySnippet(prop, propKey, nodeBuilder),
        ]))
    })
    return x
}

function createNodeSnippet(node: md.Node, nodeBuilder: NodeBuilder): fp.InlinePart {
    return [
        '(',
        () => {
            return createPropertiesSnippet(node, nodeBuilder)
        },
        ')',
    ]
}

function createPropertyDeserializer(
    context: bc.ExpectContext,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: NodeBuilder,
    isCompact: boolean,
    registerSnippetGenerators: RegisterSnippetsGenerators,
): bc.ValueHandler {
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectDictionary(
                                openData => {
                                    registerSnippetGenerators(openData.start, null, null)
                                },
                                (_key, propertyData) => {
                                    registerSnippetGenerators(propertyData.keyRange, null, null)
                                    return context.expectNothing()
                                },
                                endData => {
                                    registerSnippetGenerators(endData.range, null, null)
                                },
                            )
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            const collBuilder = nodeBuilder.setCollection(propKey)
                            return context.expectDictionary(
                                beginData => {
                                    registerSnippetGenerators(beginData.start, null, null)
                                },
                                (_key, propertyData, _preData) => {

                                    const entry = collBuilder.createEntry()
                                    entry.insert() //might be problematic.. insertion before fully initialized

                                    registerSnippetGenerators(
                                        propertyData.keyRange,
                                        null,
                                        () => {
                                            const out: string[] = []
                                            fp.serialize(
                                                [createNodeSnippet($$$.node, entry.node)], "    ", true, snippet => {
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

                                    return createNodeDeserializer(
                                        context,
                                        $$$.node,
                                        entry.node,
                                        isCompact,
                                        registerSnippetGenerators,
                                    )
                                },
                                endData => {
                                    registerSnippetGenerators(endData.range, null, null)
                                },
                            )
                        }
                        default:
                            return assertUnreachable($$["has instances"][0])
                    }
                }
                case "list": {
                    const $$ = $.type[1]

                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectList(
                                beginData => {
                                    registerSnippetGenerators(beginData.start, null, null)
                                },
                                () => {
                                    return context.expectNothing()
                                },
                                endData => {
                                    registerSnippetGenerators(endData.range, null, null)
                                },
                            )
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            const collBuilder = nodeBuilder.setCollection(propKey)
                            return context.expectList(
                                beginData => {
                                    registerSnippetGenerators(beginData.start, null, null)
                                },
                                () => {
                                    const entry = collBuilder.createEntry()
                                    entry.insert()

                                    return createNodeDeserializer(
                                        context,
                                        $$$.node,
                                        entry.node,
                                        isCompact,
                                        registerSnippetGenerators,
                                    )
                                },
                                endData => {
                                    registerSnippetGenerators(endData.range, null, null)
                                },
                            )
                        }
                        default:
                            return assertUnreachable($$["has instances"][0])
                    }
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = propDefinition.type[1]
            const componentBuilder = nodeBuilder.setComponent(propKey)
            return createNodeDeserializer(
                context,
                $.type.get().node,
                componentBuilder.node,
                isCompact,
                registerSnippetGenerators,
            )
        }
        case "state group": {
            const $ = propDefinition.type[1]
            return context.expectTaggedUnion(
                $.states.map((stateDef, stateName) => {
                    return (tuData, tuPreData, optionPreData) => {
                        registerSnippetGenerators(tuData.startRange, null, null)
                        registerSnippetGenerators(tuData.optionRange, null, null)
                        const state = nodeBuilder.setStateGroup(propKey, stateName, tuData.startRange, tuPreData, tuData.optionRange, optionPreData)
                        return createNodeDeserializer(context, stateDef.node, state.node, isCompact, registerSnippetGenerators)
                    }
                }),
                (_option, tuData) => {
                    registerSnippetGenerators(tuData.startRange, null, null)
                    registerSnippetGenerators(
                        tuData.optionRange,
                        () => {
                            return Object.keys($.states.map(s => s))
                        },
                        null
                    )
                },
            )
        }
        case "value": {
            return context.expectSimpleValue((value, svData, comments) => {
                const valueBuilder = nodeBuilder.setSimpleValue(propKey, value, svData.quote !== null, svData.range, comments)
                registerSnippetGenerators(
                    svData.range,
                    () => {
                        return valueBuilder.getSuggestions()
                    },
                    null,
                )
            })
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

export function createNodeDeserializer(
    context: bc.ExpectContext,
    nodeDefinition: md.Node,
    nodeBuilder: NodeBuilder,
    isCompact: boolean,
    registerSnippetGenerators: RegisterSnippetsGenerators,
): bc.ValueHandler {
    if (isCompact) {
        const expectedElements: bc.ExpectedElements = []
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedElements.push(() => {
                return createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, isCompact, registerSnippetGenerators)
            })
        })
        return context.expectArrayType(
            startData => {
                registerSnippetGenerators(startData.start, null, null)
            },
            expectedElements,
            endData => {
                registerSnippetGenerators(endData.range, null, null)
            }
        )

    } else {
        const expectedProperties: bc.ExpectedProperties = {}
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedProperties[propKey] = {
                onExists: propertyData => {
                    registerSnippetGenerators(
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
                    return createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, isCompact, registerSnippetGenerators)
                },
                onNotExists: () => {
                    //
                },
            }
        })
        return context.expectType(
            startRange => {
                registerSnippetGenerators(
                    startRange,
                    null,
                    () => {
                        const out: string[] = []
                        fp.serialize(
                            [
                                '',
                                () => {
                                    return createPropertiesSnippet(nodeDefinition, nodeBuilder)
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
            },
            expectedProperties,
            (_hasErrors, endRange) => {
                registerSnippetGenerators(endRange, null, null)
            },
            (_key, metaData, _preData) => {
                registerSnippetGenerators(
                    metaData.keyRange,
                    () => {
                        return Object.keys(expectedProperties)
                    },
                    null
                )
            },
        )

    }

}
