/* eslint
    no-shadow: "off",
*/
import { ValueSerializer } from "./serializerAPI"
import * as t from "../metaDataSchema"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeNode(node: t.Node, serializer: ValueSerializer) {
    return serializer.type(t$ => {
        t$.add("properties", false, v$ => v$.dictionary(propertiesBuilder => {
            node.properties.forEach((prop, propKey) => {
                propertiesBuilder.add(propKey, false, v$ => v$.type(t$ => {
                    t$.add("name", true, v$ => v$.simpleValue(propKey, true))
                    t$.add("type", false, v$ => {
                        switch (prop.type[0]) {
                            case "collection": {
                                const $ = prop.type[1]
                                return v$.taggedUnion("collection", t$ => t$.type(t$ => {
                                    t$.add("type", false, v$ => {
                                        switch ($.type[0]) {
                                            case "dictionary": {
                                                const $$ = $.type[1]
                                                return v$.taggedUnion("dictionary", v$ => v$.type(t$ => {

                                                    t$.add("key property", false, t$ => t$.simpleValue("name", true))
                                                    t$.add("node", false, t$ => serializeNode($$.node, t$))
                                                }))
                                            }
                                            case "list": {
                                                const $$ = $.type[1]
                                                return v$.taggedUnion("list", v$ => v$.type(t$ => {
                                                    t$.add("node", false, v$ => serializeNode($$.node, v$))

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
                                    t$.add("type", false, v$ => v$.simpleValue($.type.name, true))

                                }))
                            }
                            case "state group": {
                                const $ = prop.type[1]

                                return v$.taggedUnion("state group", v$ => v$.type(t$ => {
                                    t$.add("states", false, v$ => v$.dictionary(d$ => {
                                        $.states.forEach((state, stateName) => {
                                            d$.add("name", true, v$ => v$.simpleValue(stateName, true))
                                            d$.add("node", false, v$ => serializeNode(state.node, v$))
                                        })
                                    }))
                                }))
                            }
                            case "value": {
                                const $ = prop.type[1]
                                return v$.taggedUnion("value", v$ => v$.type(t$ => {
                                    t$.add("default value", false, t$ => t$.simpleValue($["default value"], true))
                                    t$.add("quoted", false, t$ => t$.simpleValue($.quoted ? "true" : "false", false))
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
        t$.add("component types", false, ctsBuilder => ctsBuilder.dictionary(ctBuilder => {
            metaData["component types"].forEach((ct, ctName) => {
                ctBuilder.add(ctName, false, $ => $.type($$ => {
                    $$.add("node", false, $$$ => serializeNode(ct.node, $$$))
                }))
            })
        }))
        t$.add("root type", false, $ => $.simpleValue(metaData["root type"].name, true))
    })
}