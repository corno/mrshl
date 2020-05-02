import * as m from "../metaDataSchema"
import { RootSerializer, ValueSerializer } from "./serializerAPI"
import { SerializableNode, SerializableDataset } from "./serializable"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeNode(
    definition: m.Node,
    node: SerializableNode,
    valueSerializer: ValueSerializer,
    compact: boolean,
    keyProperty: m.IReference<m.Property> | null,
) {
    function serializeValue(elementSerializer: ValueSerializer, property: m.Property, propertyKey: string) {

        switch (property.type[0]) {
            case "component": {
                const $ = property.type[1]
                return serializeNode(
                    $.type.get().node,
                    node.getComponent(propertyKey).node,
                    elementSerializer,
                    compact,
                    null,
                )
            }
            case "collection": {
                const $ = property.type[1]
                switch ($.type[0]) {
                    case "dictionary": {
                        const $$ = $.type[1]
                        return elementSerializer.dictionary(dict => {
                            if ($$["has instances"][0] === "yes") {
                                const $$$ = $$["has instances"][1]
                                const collection = node.getDictionary(propertyKey)
                                collection.forEachEntry((entry, keyValue) => {
                                    const isKeyProp = false//FIXME
                                    dict.add(keyValue, isKeyProp, entryBuilder => {
                                        return serializeNode(
                                            $$$.node,
                                            entry.node,
                                            entryBuilder,
                                            compact,
                                            $$$["key property"],
                                        )
                                    })
                                })
                            }
                        })
                    }
                    case "list": {
                        const $$ = $.type[1]
                        return elementSerializer.list(list => {
                            if ($$["has instances"][0] === "yes") {
                                const $$$ = $$["has instances"][1]
                                const collection = node.getList(propertyKey)
                                collection.forEachEntry(entry => {
                                    list.add(entryBuilder => {
                                        return serializeNode(
                                            $$$.node,
                                            entry.node,
                                            entryBuilder,
                                            compact,
                                            null,
                                        )
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
                return elementSerializer.taggedUnion(sg.getCurrentState().getStateKey(), stateDataBuilder => {
                    const state = $.states.get(sg.getCurrentState().getStateKey())
                    if (state === null) {
                        throw new Error("UNEXPECTED: INVALID DATA")
                    }
                    return serializeNode(
                        state.node,
                        sg.getCurrentState().node,
                        stateDataBuilder,
                        compact,
                        null,
                    )
                })
            }
            case "value": {
                const $ = property.type[1]
                return elementSerializer.simpleValue(node.getValue(propertyKey).getValue(), $.quoted)
            }
            default:
                return assertUnreachable(property.type[0])
        }
    }
    if (compact) {
        valueSerializer.arrayType(arraySerializer => {
            definition.properties.forEach((property, propertyKey) => {
                arraySerializer.add(elementSerializer => {
                    serializeValue(elementSerializer, property, propertyKey)
                })
            })
        })
    } else {
        valueSerializer.type(typeSerializer => {
            definition.properties.forEach((property, propertyKey) => {
                const isKeyProperty = keyProperty === null ? false : property === keyProperty.get()
                typeSerializer.add(propertyKey, isKeyProperty, elementSerializer => {
                    serializeValue(elementSerializer, property, propertyKey)
                })
            })
        })
    }
}

export function serialize(
    dataset: SerializableDataset,
    serializer: RootSerializer,
    compact: boolean,
): void {
    serializer.serializeSchema(dataset)
    serializeNode(dataset.schema["root type"].get().node, dataset.root, serializer.root, compact, null)
}
