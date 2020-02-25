import * as m from "../types"
import { RootSerializer, ValueSerializer } from "./api"
import { SerializableNode, SerializableRoot } from "./serializable"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeNode(definition: m.Node, node: SerializableNode, builder: ValueSerializer) {
    return builder.arrayType(out => {
        definition.properties.forEach((property, propertyKey) => {
            out.add(elementBuilder => {
                switch (property.type[0]) {
                    case "component": {
                        const $ = property.type[1]
                        return serializeNode($.type.get().node, node.getComponent(propertyKey).getNode(), elementBuilder)
                    }
                    case "collection": {
                        const $ = property.type[1]
                        const collection = node.getCollection(propertyKey)
                        switch ($.type[0]) {
                            case "dictionary": {
                                const $$ = $.type[1]
                                return elementBuilder.dictionary(dict => {
                                    if ($$["has instances"][0] === "yes") {
                                        const $$$ = $$["has instances"][1]
                                        const keyPropDefinition = $$$["key property"]
                                        collection.forEachEntry(entry => {
                                            const keyValue = entry.getNode().getString(keyPropDefinition.getName()).getValue()
                                            dict.add(keyValue, false, entryBuilder => {
                                                return serializeNode($$$.node, entry.getNode(), entryBuilder)
                                            })
                                        })
                                    }
                                })
                            }
                            case "list": {
                                const $$ = $.type[1]
                                return elementBuilder.list(list => {
                                    if ($$["has instances"][0] === "yes") {
                                        const $$$ = $$["has instances"][1]
                                        collection.forEachEntry(entry => {
                                            list.add(entryBuilder => {
                                                return serializeNode($$$.node, entry.getNode(), entryBuilder)
                                            })
                                        })
                                    }
                                })
                            }
                            default:
                                return assertUnreachable($.type[0])
                        }
                    }
                    case "state group": {
                        const $ = property.type[1]
                        const sg = node.getStateGroup(propertyKey)
                        return elementBuilder.taggedUnion(sg.getCurrentState().getStateKey(), stateDataBuilder => {
                            const state = $.states.get(sg.getCurrentState().getStateKey())
                            if (state === null) {
                                throw new Error("UNEXPECTED: INVALID DATA")
                            }
                            return serializeNode(state.node, sg.getCurrentState().node, stateDataBuilder)
                        })
                    }
                    case "value": {
                        const $ = property.type[1]
                        switch ($.type[0]) {
                            case "boolean": {
                                //const $$ = $.type[1]
                                return elementBuilder.boolean(node.getBoolean(propertyKey).getValue())
                            }
                            case "number": {
                                //const $$ = $.type[1]
                                return elementBuilder.number(node.getNumber(propertyKey).getValue())
                            }
                            case "string": {
                                //const $$ = $.type[1]
                                return elementBuilder.string(node.getString(propertyKey).getValue())
                            }
                            default:
                                return assertUnreachable($.type[0])
                        }
                    }
                    default:
                        return assertUnreachable(property.type[0])
                }
            })
        })
    })
}

export function serialize(schemaReference: string, definition: m.Schema, root: SerializableRoot, serializer: RootSerializer): void {
    serializer.schemaReference(schemaReference)
    serializeNode(definition["root type"].get().node, root.rootNode, serializer.root)
}
