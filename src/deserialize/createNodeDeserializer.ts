import * as bc from "bass-clarinet"
import * as fp from "fountain-pen"
import * as md from "../internalSchema"
import { NodeBuilder, NodeValidator } from "./api"
import { RegisterSnippetsGenerators } from "./registerSnippetGenerators"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

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

            return createNodeSnippet($.type.get().node)
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

function createPropertiesSnippet(node: md.Node): fp.IParagraph {
    const x: fp.ParagraphPart[] = []
    node.properties.map((prop, propKey) => {
        x.push(fp.line([
            `'${propKey}': `,
            createPropertySnippet(prop),
        ]))
    })
    return x
}

function createNodeSnippet(node: md.Node): fp.InlinePart {
    return [
        '(',
        () => {
            return createPropertiesSnippet(node)
        },
        ')',
    ]
}

function createPropertyDeserializer(
    context: bc.ExpectContext,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: NodeBuilder,
    nodeValidator: NodeValidator,
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
                            const collValidator = nodeValidator.setCollection(propKey)
                            return context.expectDictionary(
                                beginData => {
                                    registerSnippetGenerators(beginData.start, null, null)
                                },
                                (_key, propertyData, _preData) => {
                                    registerSnippetGenerators(
                                        propertyData.keyRange,
                                        null,
                                        () => {
                                            const out: string[] = []
                                            fp.serialize(
                                                [createNodeSnippet($$$.node)], "    ", true, snippet => {
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

                                    const entry = collBuilder.createEntry()
                                    entry.insert() //might be problematic.. insertion before fully initialized
                                    const entryValidator = collValidator.createEntry()
                                    entryValidator.insert() //might be problematic.. insertion before fully initialized

                                    return createNodeDeserializer(
                                        context,
                                        $$$.node,
                                        entry.node,
                                        entryValidator.node,
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
                            const collValidator = nodeValidator.setCollection(propKey)
                            return context.expectList(
                                beginData => {
                                    registerSnippetGenerators(beginData.start, null, null)
                                },
                                () => {
                                    const entry = collBuilder.createEntry()
                                    entry.insert()

                                    const entryValidator = collValidator.createEntry()
                                    entryValidator.insert()

                                    return createNodeDeserializer(
                                        context,
                                        $$$.node,
                                        entry.node,
                                        entryValidator.node,
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
            const componentValidator = nodeValidator.setComponent(propKey)
            return createNodeDeserializer(
                context,
                $.type.get().node,
                componentBuilder.node,
                componentValidator.node,
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
                        const stateValidator = nodeValidator.setStateGroup(propKey, stateName, tuData.startRange, tuPreData, tuData.optionRange, optionPreData)
                        return createNodeDeserializer(context, stateDef.node, state.node, stateValidator.node, isCompact, registerSnippetGenerators)
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
                registerSnippetGenerators(svData.range, null, null)
                nodeBuilder.setSimpleValue(propKey, value, svData.quote !== null, svData.range, comments)
                nodeValidator.setSimpleValue(propKey, value, svData.quote !== null, svData.range, comments)
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
    nodeValidator: NodeValidator,
    isCompact: boolean,
    registerSnippetGenerators: RegisterSnippetsGenerators,
): bc.ValueHandler {
    if (isCompact) {
        const expectedElements: bc.ExpectedElements = []
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedElements.push(() => {
                return createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, nodeValidator, isCompact, registerSnippetGenerators)
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
                                [createPropertySnippet(propDefinition)], "    ", true, snippet => {
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
                    return createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, nodeValidator, isCompact, registerSnippetGenerators)
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
                                    return createPropertiesSnippet(nodeDefinition)
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
