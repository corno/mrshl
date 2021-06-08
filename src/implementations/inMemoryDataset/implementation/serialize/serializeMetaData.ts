// /* eslint
//     no-shadow: "off",
// */
import * as astncore from "astn-core"
// import * as id from "../API/IDataset"
// import * as md from "../API/types"
// import * as gapi from "../API/generics"

import { IReference, NodeDefinition, Schema } from "../../../../interfaces/typedParserDefinitions"
import { IReadonlyDictionary } from "../../../../interfaces/typedParserDefinitions"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function serializeMetaData(
    schema: Schema,
): astncore.TreeBuilderEvent<null>[] {
    const events: astncore.TreeBuilderEvent<null>[] = []
    function addEvent(e: astncore.TreeBuilderEventType) {
        //console.error(JSON.stringify(e))
        events.push({
            annotation: null,
            type: e,
        })

    }

    function serializeDictionary<T>(
        dict: IReadonlyDictionary<T>,
        entryCallback: (t: T) => void,
    ) {
        addEvent(["open object", {
            type: ["dictionary"],
        }])
        dict.forEach((entry, key) => {
            addEvent(["key", {
                name: key,
            }])
            entryCallback(entry)
        })
        addEvent(["close object"])
    }
    function serializeVerboseType(properties: { [key: string]: () => void }) {
        addEvent(["open object", {
            type: ["verbose type"],
        }])
        Object.keys(properties).sort().forEach(key => {
            addEvent(["key", {
                name: key,
            }])
            properties[key]()
        })
        addEvent(["close object"])
    }
    function serializeTaggedUnion(option: string, callback: () => void) {
        addEvent(["tagged union", {}])
        addEvent(["option", {
            name: option,
        }])
        callback()
    }
    function serializeQuotedString(value: string) {
        addEvent(["string value", {
            type: ["quoted", {
                value: value,
            }],
        }])
    }
    function serializeReference<T>(reference: IReference<T>) {
        addEvent(["string value", {
            type: ["quoted", {
                value: reference.name,
            }],
        }])
    }

    function serializeNonWrappedString(value: string) {
        addEvent(["string value", {
            type: ["nonwrapped", {
                value: value,
            }],
        }])
    }


    function serializeNodeDefinition(node: NodeDefinition) {
        serializeVerboseType({
            properties: () => {
                serializeDictionary(node.properties, propDef => {
                    serializeVerboseType({
                        type: () => {
                            serializeTaggedUnion(propDef.type[0], () => {
                                switch (propDef.type[0]) {
                                    case "collection": {
                                        const $ = propDef.type[1]
                                        serializeVerboseType({
                                            type: () => {
                                                serializeTaggedUnion($.type[0], () => {
                                                    switch ($.type[0]) {
                                                        case "dictionary": {
                                                            const $$ = $.type[1]
                                                            serializeVerboseType({
                                                                "key property": () => {
                                                                    serializeReference($$["key property"])
                                                                },
                                                                "node": () => {
                                                                    serializeNodeDefinition($$.node)
                                                                },
                                                            })
                                                            break
                                                        }
                                                        case "list": {
                                                            const $$ = $.type[1]
                                                            serializeVerboseType({
                                                                "key property": () => {
                                                                    //
                                                                },
                                                                "node": () => {
                                                                    serializeNodeDefinition($$.node)
                                                                },
                                                            })
                                                            break
                                                        }
                                                        default:
                                                            assertUnreachable($.type[0])
                                                    }
                                                })
                                            },
                                        })
                                        break
                                    }
                                    case "component": {
                                        const $ = propDef.type[1]
                                        serializeVerboseType({
                                            type: () => {
                                                serializeReference($.type)
                                            },
                                        })
                                        break
                                    }
                                    case "tagged union": {
                                        const $ = propDef.type[1]
                                        serializeVerboseType({
                                            "default state": () => {
                                                serializeReference($["default option"])
                                            },
                                            "states": () => {
                                                serializeDictionary(
                                                    $.options,
                                                    state => {
                                                        serializeVerboseType({
                                                            node: () => serializeNodeDefinition(state.node),
                                                        })
                                                    }
                                                )
                                            },

                                        })
                                        break
                                    }
                                    case "string": {
                                        const $ = propDef.type[1]
                                        serializeVerboseType({
                                            "default value": () => {
                                                serializeQuotedString($["default value"])
                                            },
                                            "quoted": () => {
                                                serializeNonWrappedString($.quoted ? "true" : "false")
                                            },
                                        })
                                        break
                                    }
                                    default:
                                        assertUnreachable(propDef.type[0])
                                }
                            })
                        },
                    })
                })
            },
        })
    }
    serializeVerboseType({
        "component types": () => {
            serializeDictionary(
                schema["component types"],
                componentType => {
                    serializeVerboseType({
                        node: () => serializeNodeDefinition(componentType.node),
                    })
                }
            )
        },
        "root type": () => {
            serializeReference(schema["root type"])
        },
    })
    return events
}