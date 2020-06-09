import { RootSerializer, ValueSerializer } from "./serializerAPI"
import * as syncAPI from "../syncAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeProperty(
    elementSerializer: ValueSerializer,
    property: syncAPI.Property,
    compact: boolean,
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
                    dict.addEntry(keyValue, entryBuilder => {
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

function nodeIsDefault(node: syncAPI.Node): boolean {
    let foundNonDefault = false
    node.forEachProperty(prop => {
        if (!propertyIsDefault(prop)) {
            foundNonDefault = true
        }
    })
    return !foundNonDefault
}

function propertyIsDefault(property: syncAPI.Property): boolean {
    switch (property.type[0]) {
        case "component": {
            const $ = property.type[1]
            return nodeIsDefault($.node)
        }
        case "dictionary": {
            const $ = property.type[1]
            return $.isEmpty()
        }
        case "list": {
            const $ = property.type[1]
            return $.isEmpty()
        }
        case "state group": {
            const $ = property.type[1]
            if ($.getCurrentState().getStateKey() !== $.definition["default state"].name) {
                return false
            }
            return nodeIsDefault($.getCurrentState().node)
        }
        case "value": {
            const $ = property.type[1]
            return $.getValue() === $.definition["default value"]
        }
        default:
            return assertUnreachable(property.type[0])
    }
}

function serializeNode(
    node: syncAPI.Node,
    valueSerializer: ValueSerializer,
    compact: boolean
) {
    if (compact) {
        valueSerializer.arrayType(arraySerializer => {
            node.forEachProperty(property => {
                arraySerializer.add(elementSerializer => {
                    serializeProperty(elementSerializer, property, compact)
                })
            })
        })
    } else {
        valueSerializer.type(typeSerializer => {
            node.forEachProperty((property, propertyKey) => {
                if (!propertyIsDefault(property)) {
                    typeSerializer.addProperty(propertyKey, property.isKeyProperty, elementSerializer => {
                        serializeProperty(elementSerializer, property, compact)
                    })
                }
            })
        })
    }
}

export function serialize(
    dataset: syncAPI.IDataset,
    serializer: RootSerializer,
    compact: boolean,
): void {
    serializer.serializeHeader(dataset, compact)
    serializeNode(dataset.root, serializer.root, compact)
}
