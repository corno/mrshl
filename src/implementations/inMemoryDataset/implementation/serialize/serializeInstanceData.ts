import * as astncore from "astn-core"
import { RootImp } from "../Root"
import { Node } from "../internals/Node"
import { NodeDefinition, PropertyDefinition } from "../../../../deserialize/interfaces/typedParserDefinitions"
import { SerializationStyle } from "../../../../deserialize/interfaces/dataset"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}


function nodeIsDefault(node: Node, def: NodeDefinition): boolean {
    let foundNonDefault = false
    def.properties.forEach((propDef, key) => {
        if (!propertyIsDefault(node, key, propDef)) {
            foundNonDefault = true
        }
    })
    return !foundNonDefault
}

function propertyIsDefault(node: Node, propertyName: string, propertyDef: PropertyDefinition): boolean {
    switch (propertyDef.type[0]) {
        case "component": {
            const $ = propertyDef.type[1]
            return nodeIsDefault(node.components.getUnsafe(propertyName).node, $.type.get().node)
        }
        case "dictionary": {
            //const $ = propertyDef.type[1]
            return node.collections.getUnsafe(propertyName).entries.isEmpty()
        }
        case "list": {
            //const $ = propertyDef.type[1]
            return node.collections.getUnsafe(propertyName).entries.isEmpty()
        }
        case "tagged union": {
            const $ = propertyDef.type[1]

            const tu = node.taggedUnions.getUnsafe(propertyName)

            const optionKey = tu.currentState.get().key

            if (tu.currentState.get().key !== $["default option"].name) {
                return false
            }
            return nodeIsDefault(tu.currentState.get().node, $.options.getUnsafe(optionKey).node)
        }
        case "string": {
            const $ = propertyDef.type[1]
            return node.values.getUnsafe(propertyName).value.get() === $["default value"]
        }
        default:
            return assertUnreachable(propertyDef.type[0])
    }
}

export interface Out<LeafEvent, BlockEvent> {
    sendEvent(event: LeafEvent): void
    sendBlock(
        event: BlockEvent,
        callback: (out: Out<LeafEvent, BlockEvent>) => void,
    ): void
}

export type SerializeOut = Out<astncore.TreeBuilderEventType, {
    open: astncore.TreeBuilderEventType
    close: astncore.TreeBuilderEventType
}>

export function serializeRoot(
    root: RootImp,
    style: SerializationStyle,
    out: SerializeOut
): void {
    // function out.sendEventBlock(
    //     open: astncore.TreeBuilderEventType,
    //     content: () => astncore.TreeBuilderEvent<null>[],
    //     close: astncore.TreeBuilderEventType,
    // ) {
    //     out.sendEvent(open)
    //     const c = content()
    //     c.forEach(e => {
    //         events.push(e)
    //     })
    //     out.sendEvent(close)
    // }
    function serializeNode(
        node: Node,
        definition: NodeDefinition,
        isOuterNode: boolean,
        out: SerializeOut,
    ) {
        function serializeProperty(
            key: string,
            propDef: PropertyDefinition,
            out: SerializeOut,
        ) {
            switch (propDef.type[0]) {
                case "dictionary": {
                    const $$ = propDef.type[1]
                    const collection = node.collections.getUnsafe(key)
                    out.sendBlock(
                        {
                            open: ["open object", {
                                type: ["dictionary"],
                            }],
                            close:
                                ["close object", {
                                    //
                                }],
                        },
                        out => {
                            collection.entries.forEach(e => {
                                const keyVal = e.entry.key
                                if (keyVal === null) {
                                    throw new Error("unexpected")
                                }
                                out.sendEvent(["simple string", {
                                    value: keyVal?.value.get(),
                                    wrapping: ["quote", {}],
                                }])
                                serializeNode(e.node, $$.node, true, out)
                            })
                        },
                    )
                    break
                }
                case "list": {
                    const $$ = propDef.type[1]
                    const collection = node.collections.getUnsafe(key)

                    out.sendBlock(
                        {
                            open: ["open array", {
                                type: ["shorthand type"],
                            }],
                            close:
                                ["close array", {
                                    //
                                }],
                        },
                        out => {
                            collection.entries.forEach(e => {
                                serializeNode(e.node, $$.node, true, out)
                            })
                        },
                    )
                    break
                }
                case "component": {
                    const $ = propDef.type[1]
                    serializeNode(node.components.getUnsafe(key).node, $.type.get().node, false, out)
                    break
                }
                case "tagged union": {
                    const $ = propDef.type[1]
                    switch (style[0]) {
                        case "expanded": {
                            out.sendEvent(["tagged union", {}])
                            break
                        }
                        case "compact": {
                            break
                        }
                        default:
                            assertUnreachable(style[0])
                    }
                    const sg = node.taggedUnions.getUnsafe(key)
                    out.sendEvent(["simple string", {
                        value: sg.currentStateKey.get(),
                        wrapping: ["apostrophe", {}],
                    }])
                    serializeNode(node.taggedUnions.getUnsafe(key).currentState.get().node, $.options.getUnsafe(sg.currentStateKey.get()).node, false, out)

                    break
                }
                case "string": {
                    const $ = propDef.type[1]
                    out.sendEvent(["simple string", {
                        value: node.values.getUnsafe(key).value.get(),
                        wrapping: $.quoted
                            ? ["quote", {
                            }]
                            : ["none", {
                            }],
                    }])
                    break
                }
                default:
                    assertUnreachable(propDef.type[0])
            }

        }
        switch (style[0]) {
            case "expanded": {
                const $ = style[1]
                out.sendBlock(
                    {
                        open: ["open object", {
                            type: ["verbose type"],
                        }],
                        close:
                            ["close object", {
                                //
                            }],
                    },
                    out => {
                        definition.properties.forEach((propDef, key) => {
                            if ($.omitPropertiesWithDefaultValues && propertyIsDefault(node, key, propDef)) {
                                return
                            }
                            out.sendEvent(["simple string", {
                                value: key,
                                wrapping: ["apostrophe", {}],
                            }])
                            serializeProperty(key, propDef, out)
                        })
                    },
                )
                break
            }
            case "compact": {
                if (isOuterNode) {
                    out.sendBlock(
                        {
                            open: ["open array", {
                                type: ["shorthand type"],
                            }],
                            close:
                                ["close array", {
                                    //
                                }],
                        },
                        out => {
                            definition.properties.forEach((propDef, key) => {
                                serializeProperty(key, propDef, out)
                            })
                        },
                    )
                } else {
                    definition.properties.forEach((propDef, key) => {
                        serializeProperty(key, propDef, out)
                    })
                }
                break
            }
            case "expanded": {
                out.sendBlock(
                    {
                        open: ["open object", {
                            type: ["verbose type"],
                        }],
                        close:
                            ["close object", {
                                //
                            }],
                    },
                    out => {
                        definition.properties.forEach((propDef, key) => {
                            if (propertyIsDefault(node, key, propDef)) {
                                return
                            }
                            out.sendEvent(["simple string", {
                                value: key,
                                wrapping: ["apostrophe", {}],
                            }])
                            serializeProperty(key, propDef, out)
                        })
                    },
                )
                break
            }
            default:
                assertUnreachable(style[0])
        }
    }
    serializeNode(root.rootNode, root.schema["root type"].get().node, true, out)
}