import * as astncore from "astn-core"
import { RootImp } from "../Root"
import { Node } from "../internals/Node"
import { NodeDefinition, PropertyDefinition } from "../../../../interfaces/typedParserDefinitions"

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
        case "collection": {
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
    style: ["verbose"] | ["shorthand"],
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
        keyProp: string | null,
        isOuterNode: boolean,
        out: SerializeOut,
    ) {
        function serializeProperty(
            key: string,
            propDef: PropertyDefinition,
            out: SerializeOut,
        ) {
            switch (propDef.type[0]) {
                case "collection": {
                    const $ = propDef.type[1]
                    const collection = node.collections.getUnsafe(key)

                    switch ($.type[0]) {
                        case "dictionary": {
                            const $$ = $.type[1]
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
                                        out.sendEvent(["simple string", {
                                            value: e.node.values.getUnsafe($$["key property"].name).value.get(),
                                            wrapping: ["quote", {}],
                                        }])
                                        serializeNode(e.node, $$.node, $$["key property"].name, true, out)
                                    })
                                },
                            )
                            break
                        }
                        case "list": {
                            const $$ = $.type[1]
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
                                        serializeNode(e.node, $$.node, null, true, out)
                                    })
                                },
                            )
                            break
                        }
                        default:
                            assertUnreachable($.type[0])
                    }
                    break
                }
                case "component": {
                    const $ = propDef.type[1]
                    serializeNode(node.components.getUnsafe(key).node, $.type.get().node, null, false, out)
                    break
                }
                case "tagged union": {
                    const $ = propDef.type[1]
                    if (style[0] === "verbose") {
                        out.sendEvent(["tagged union", {}])
                    }
                    const sg = node.taggedUnions.getUnsafe(key)
                    out.sendEvent(["simple string", {
                        value: sg.currentStateKey.get(),
                        wrapping: ["apostrophe", {}],
                    }])
                    serializeNode(node.taggedUnions.getUnsafe(key).currentState.get().node, $.options.getUnsafe(sg.currentStateKey.get()).node, null, false, out)

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
        if (style[0] === "verbose") {
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
                        if (key === keyProp) {
                            //don't serialize the key property
                            return
                        }
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
        } else {
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
                            if (key === keyProp) {
                                //don't serialize the key property
                                return
                            }
                            serializeProperty(key, propDef, out)
                        })
                    },
                )
            } else {
                definition.properties.forEach((propDef, key) => {
                    if (key === keyProp) {
                        //don't serialize the key property
                        return
                    }
                    serializeProperty(key, propDef, out)
                })
            }
        }
    }
    serializeNode(root.rootNode, root.schema["root type"].get().node, null, true, out)
}