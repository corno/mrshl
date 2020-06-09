/* eslint
    no-shadow: "off",
*/
import { ValueSerializer } from "./serializerAPI"
import * as t from "../types"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeNode(node: t.Node, serializer: ValueSerializer) {
    return serializer.type(t$ => {
        t$.addProperty("properties", false, v$ => v$.dictionary(propertiesBuilder => {
            node.properties.forEach((prop, propKey) => {
                propertiesBuilder.addEntry(propKey, v$ => v$.type(t$ => {
                    t$.addProperty("name", true, v$ => v$.simpleValue(propKey, true))
                    t$.addProperty("type", false, v$ => {
                        switch (prop.type[0]) {
                            case "collection": {
                                const $ = prop.type[1]
                                return v$.taggedUnion("collection", t$ => t$.type(t$ => {
                                    t$.addProperty("type", false, v$ => {
                                        switch ($.type[0]) {
                                            case "dictionary": {
                                                const $$ = $.type[1]
                                                return v$.taggedUnion("dictionary", v$ => v$.type(t$ => {

                                                    t$.addProperty("key property", false, t$ => t$.simpleValue("name", true))
                                                    t$.addProperty("node", false, t$ => serializeNode($$.node, t$))
                                                }))
                                            }
                                            case "list": {
                                                const $$ = $.type[1]
                                                return v$.taggedUnion("list", v$ => v$.type(t$ => {
                                                    t$.addProperty("node", false, v$ => serializeNode($$.node, v$))

                                                }))
                                            }
                                            default:
                                                return assertUnreachable($.type[0])
                                        }
                                    })
                                }))
                            }
                            case "component": {
                                const $ = prop.type[1]
                                return v$.taggedUnion("component", v$ => v$.type(t$ => {
                                    t$.addProperty("type", false, v$ => v$.simpleValue($.type.name, true))

                                }))
                            }
                            case "state group": {
                                const $ = prop.type[1]

                                return v$.taggedUnion("state group", v$ => v$.type(t$ => {
                                    t$.addProperty("states", false, v$ => v$.dictionary(d$ => {
                                        $.states.forEach((state, stateName) => {
                                            d$.addEntry(stateName, v$ => v$.type(t$ => {
                                                t$.addProperty("name", true, v$ => v$.simpleValue(stateName, true))
                                                t$.addProperty("node", false, v$ => serializeNode(state.node, v$))
                                            }))
                                        })
                                    }))
                                }))
                            }
                            case "value": {
                                const $ = prop.type[1]
                                return v$.taggedUnion("value", v$ => v$.type(t$ => {
                                    t$.addProperty("default value", false, t$ => t$.simpleValue($["default value"], true))
                                    t$.addProperty("quoted", false, t$ => t$.simpleValue($.quoted ? "true" : "false", false))
                                }))
                            }
                            default:
                                return assertUnreachable(prop.type[0])
                        }
                    })
                }))
            })
        }))
    })
}

export function serializeMetaData(metaData: t.Schema, serializer: ValueSerializer): void {
    serializer.type(t$ => {
        t$.addProperty("component types", false, ctsBuilder => ctsBuilder.dictionary(ctBuilder => {
            metaData["component types"].forEach((ct, ctName) => {
                ctBuilder.addEntry(ctName, $ => $.type($$ => {
                    $$.addProperty("node", false, $$$ => serializeNode(ct.node, $$$))
                }))
            })
        }))
        t$.addProperty("root type", false, $ => $.simpleValue(metaData["root type"].name, true))
    })
}