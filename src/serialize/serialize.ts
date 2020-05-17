import { RootSerializer, ValueSerializer } from "./serializerAPI"
import * as dapi from "../syncAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeNode(
    node: dapi.Node,
    valueSerializer: ValueSerializer,
    compact: boolean
) {
    function serializeProperty(
        elementSerializer: ValueSerializer,
        property: dapi.Property,
    ) {
        switch (property.type[0]) {
            case "component": {
                const $ = property.type[1]
                return serializeNode(
                    $.node,
                    elementSerializer,
                    compact,
                )
            }

            case "dictionary": {
                const $ = property.type[1]
                return elementSerializer.dictionary(dict => {
                    $.forEachEntry((entry, keyValue) => {
                        const isKeyProp = false//FIXME
                        dict.add(keyValue, isKeyProp, entryBuilder => {
                            return serializeNode(
                                entry.node,
                                entryBuilder,
                                compact,
                            )
                        })
                    })
                })
            }
            case "list": {
                const $ = property.type[1]
                return elementSerializer.list(list => {
                    $.forEachEntry(entry => {
                        list.add(entryBuilder => {
                            return serializeNode(
                                entry.node,
                                entryBuilder,
                                compact,
                            )
                        })
                    })
                })
            }
            case "state group": {
                const $ = property.type[1]
                return elementSerializer.taggedUnion($.getCurrentState().getStateKey(), stateDataBuilder => {
                    return serializeNode(
                        $.getCurrentState().node,
                        stateDataBuilder,
                        compact,
                    )
                })
            }
            case "value": {
                const $ = property.type[1]
                return elementSerializer.simpleValue($.getValue(), $.isQuoted)
            }
            default:
                return assertUnreachable(property.type[0])
        }
    }
    if (compact) {
        valueSerializer.arrayType(arraySerializer => {
            node.forEachProperty(property => {
                arraySerializer.add(elementSerializer => {
                    serializeProperty(elementSerializer, property)
                })
            })
        })
    } else {
        valueSerializer.type(typeSerializer => {
            node.forEachProperty((property, propertyKey) => {
                typeSerializer.add(propertyKey, property.isKeyProperty, elementSerializer => {
                    serializeProperty(elementSerializer, property)
                })
            })
        })
    }
}

export function serialize(
    dataset: dapi.Dataset,
    serializer: RootSerializer,
    compact: boolean,
): void {
    serializer.serializeSchema(dataset)
    serializeNode(dataset.root, serializer.root, compact)
}
