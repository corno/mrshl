/* eslint
    no-shadow: "off",
*/
import { ValueSerializer } from "./serialize/api"
import * as t from "./internalSchema"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeNode(node: t.Node, serializer: ValueSerializer) {
    return serializer.type(t$ => {
        t$.add("properties", false, t$ => t$.dictionary(propertiesBuilder => {
            node.properties.forEach((prop, propKey) => {
                propertiesBuilder.add(propKey, false, t$ => t$.type(t$ => {
                    t$.add("name", true, t$ => t$.quotedString(propKey))
                    t$.add("type", false, t$ => {
                        switch (prop.type[0]) {
                            case "collection": {
                                const $ = prop.type[1]
                                return t$.taggedUnion("collection", t$ => t$.type(t$ => {
                                    t$.add("type", false, t$ => {
                                        switch ($.type[0]) {
                                            case "dictionary": {
                                                const $$ = $.type[1]
                                                return t$.taggedUnion("dictionary", t$ => t$.type(t$ => {

                                                    t$.add("has instances", false, t$ => {
                                                        if ($$["has instances"][0] === "no") {
                                                            return t$.taggedUnion("no", t$ => t$.type(() => {
                                                                //
                                                            }))
                                                        } else {
                                                            const $$$ = $$["has instances"][1]
                                                            return t$.taggedUnion("yes", t$ => t$.type(t$ => {
                                                                t$.add("key property", false, t$ => t$.quotedString("name"))
                                                                t$.add("node", false, t$ => serializeNode($$$.node, t$))
                                                            }))
                                                        }
                                                    })
                                                }))
                                            }
                                            case "list": {
                                                const $$ = $.type[1]
                                                return t$.taggedUnion("list", t$ => t$.type(t$ => {

                                                    t$.add("has instances", false, t$ => {
                                                        if ($$["has instances"][0] === "no") {
                                                            return t$.taggedUnion("no", t$ => t$.type(() => {
                                                                //
                                                            }))
                                                        } else {
                                                            const $$$ = $$["has instances"][1]
                                                            return t$.taggedUnion("yes", t$ => t$.type(t$ => {
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
                                return t$.taggedUnion("component", t$ => t$.type(t$ => {
                                    t$.add("type", false, t$ => t$.quotedString($.type.getName()))

                                }))
                            }
                            case "state group": {
                                const $ = prop.type[1]

                                return t$.taggedUnion("state group", t$ => t$.type(t$ => {
                                    t$.add("states", false, t$ => t$.dictionary(t$ => {
                                        $.states.forEach((state, stateName) => {
                                            t$.add("name", true, t$ => t$.quotedString(stateName))
                                            t$.add("node", false, t$ => serializeNode(state.node, t$))
                                        })
                                    }))
                                }))
                            }
                            case "value": {
                                const $ = prop.type[1]
                                return t$.taggedUnion("value", t$ => t$.type(t$ => {

                                    t$.add("quoted", false, t$ => {
                                        return t$.unquotedToken($.quoted ? "true" : "false")
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
    serializer.type(t$ => {
        t$.add("component types", false, ctsBuilder => ctsBuilder.dictionary(ctBuilder => {
            metaData["component types"].forEach((ct, ctName) => {
                ctBuilder.add(ctName, false, $ => $.type($$ => {
                    $$.add("node", false, $$$ => serializeNode(ct.node, $$$))
                }))
            })
        }))
        t$.add("root type", false, $ => $.quotedString(metaData["root type"].getName()))
    })
}
