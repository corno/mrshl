import * as t from "./types"
import { ValueSerializer } from "../serialize/api"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeNode(node: t.Node, serializer: ValueSerializer) {
    return serializer.metaObject(t$ => {
        t$.add("properties", false, t$ => t$.collection(propertiesBuilder => {
            node.properties.forEach((prop, propKey) => {
                propertiesBuilder.add(propKey, false, t$ => t$.metaObject(t$ => {
                    t$.add("name", true, t$ => t$.string(propKey))
                    t$.add("type", false, t$ => {
                        switch (prop.type[0]) {
                            case "collection": {
                                const $ = prop.type[1]
                                return t$.unionType("collection", t$ => t$.metaObject(t$ => {
                                    t$.add("type", false, t$ => {
                                        switch ($.type[0]) {
                                            case "dictionary": {
                                                const $$ = $.type[1]
                                                return t$.unionType("dictionary", t$ => t$.metaObject(t$ => {

                                                    t$.add("has instances", false, t$ => {
                                                        if ($$["has instances"][0] === "no") {
                                                            return t$.unionType("no", t$ => t$.metaObject(() => { }))
                                                        } else {
                                                            const $$$ = $$["has instances"][1]
                                                            return t$.unionType("yes", t$ => t$.metaObject(t$ => {
                                                                t$.add("key property", false, t$ => t$.string("name"))
                                                                t$.add("node", false, t$ => serializeNode($$$.node, t$))
                                                            }))
                                                        }
                                                    })
                                                }))
                                            }
                                            case "list": {
                                                const $$ = $.type[1]
                                                return t$.unionType("list", t$ => t$.metaObject(t$ => {

                                                    t$.add("has instances", false, t$ => {
                                                        if ($$["has instances"][0] === "no") {
                                                            return t$.unionType("no", t$ => t$.metaObject(() => { }))
                                                        } else {
                                                            const $$$ = $$["has instances"][1]
                                                            return t$.unionType("yes", t$ => t$.metaObject(t$ => {
                                                                t$.add("node", false, t$ => serializeNode($$$.node, t$))
                                                            }))
                                                        }
                                                    })
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
                                return t$.unionType("component", t$ => t$.metaObject(t$ => {
                                    t$.add("type", false, t$ => t$.string($.type.getName()))

                                }))
                            }
                            case "state group": {
                                const $ = prop.type[1]

                                return t$.unionType("state group", t$ => t$.metaObject(t$ => {
                                    t$.add("states", false, t$ => t$.collection(t$ => {
                                        $.states.forEach((state, stateName) => {
                                            t$.add("name", true, t$ => t$.string(stateName))
                                            t$.add("node", false, t$ => serializeNode(state.node, t$))
                                        })
                                    }))
                                }))
                            }
                            case "value": {
                                const $ = prop.type[1]
                                return t$.unionType("value", t$ => t$.metaObject(t$ => {

                                    t$.add("type", false, t$ => {
                                        switch ($.type[0]) {
                                            case "boolean": {
                                                return t$.unionType("boolean", t$ => t$.metaObject(() => { }))
                                            }
                                            case "number": {
                                                return t$.unionType("number", t$ => t$.metaObject(() => { }))
                                            }
                                            case "string": {
                                                return t$.unionType("text", t$ => t$.metaObject(() => { }))
                                            }
                                            default:
                                                return assertUnreachable($.type[0])
                                        }
                                    })
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

export function serialize(metaData: t.Schema, serializer: ValueSerializer): void {
    serializer.metaObject(t$ => {
        t$.add("component types", false, ctsBuilder => ctsBuilder.collection(ctBuilder => {
            metaData["component types"].forEach((ct, ctName) => {
                ctBuilder.add(ctName, false, $ => $.metaObject($$ => {
                    $$.add("node", false, $$$ => serializeNode(ct.node, $$$))
                }))
            })
        }))
        t$.add("root type", false, $ => $.string(metaData["root type"].getName()))
    })
}
