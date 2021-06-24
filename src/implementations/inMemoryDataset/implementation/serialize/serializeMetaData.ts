// /* eslint
//     no-shadow: "off",
// */
import * as astncore from "astn-core"
// import * as id from "../API/IDataset"
// import * as md from "../API/types"
// import * as gapi from "../API/generics"

import { IReference, NodeDefinition, Schema } from "../../../../deserialize/interfaces/typedParserDefinitions"
import { IReadonlyDictionary } from "../../../../deserialize/interfaces/typedParserDefinitions"

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
            addEvent(["simple string", {
                value: key,
                wrapping: ["quote", {}],
            }])
            entryCallback(entry)
        })
        addEvent(["close object", {
            //
        }])
    }
    function serializeVerboseType(properties: { [key: string]: () => void }) {
        addEvent(["open object", {
            type: ["verbose type"],
        }])
        Object.keys(properties).sort().forEach(key => {
            addEvent(["simple string", {
                value: key,
                wrapping: ["apostrophe", {}],
            }])
            properties[key]()
        })
        addEvent(["close object", {
            //
        }])
    }
    function serializeTaggedUnion(option: string, callback: () => void) {
        addEvent(["tagged union", {}])
        addEvent(["simple string", {
            value: option,
            wrapping: ["apostrophe", {}],
        }])
        callback()
    }
    function serializeQuotedString(value: string) {
        addEvent(["simple string", {
            value: value,
            wrapping: ["quote", {}],
        }])
    }
    function serializeReference<T>(reference: IReference<T>) {
        addEvent(["simple string", {
            value: reference.name,
            wrapping: ["quote", {}],
        }])
    }

    function serializeNonWrappedString(value: string) {
        addEvent(["simple string", {
            value: value,
            wrapping: ["none", {}],
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
                                    case "dictionary": {
                                        const $$ = propDef.type[1]
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
                                        const $$ = propDef.type[1]
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