import { RootSerializer, ValueSerializer } from "./serializerAPI"
import * as syncAPI from "../syncAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function serializeComments(
    elementSerializer: ValueSerializer,
    comments: syncAPI.Comments
) {
    comments.getComments().forEach(comment => {
        console.error("FIX BLOCK OR INLINE")
        elementSerializer.lineComment(comment.value)
    })
}

function serializeProperty(
    elementSerializer: ValueSerializer,
    property: syncAPI.Property,
    compact: boolean,
): void {
    switch (property.type[0]) {
        case "component": {
            const $ = property.type[1]
            serializeNode(
                $.node,
                elementSerializer,
                compact,
            )
            break
        }

        case "dictionary": {
            const $ = property.type[1]
            serializeComments(elementSerializer, $.beginComments)

            elementSerializer.dictionary(dict => {
                $.forEachEntry((entry, keyValue) => {
                    serializeComments(elementSerializer, entry.comments)

                    dict.addEntry(keyValue, entryBuilder => {
                        serializeNode(
                            entry.node,
                            entryBuilder,
                            compact,
                        )
                    })
                })
            })
            serializeComments(elementSerializer, $.endComments)

            break
        }
        case "list": {
            const $ = property.type[1]
            serializeComments(elementSerializer, $.beginComments)
            elementSerializer.list(list => {
                $.forEachEntry(entry => {
                    list.add(entryBuilder => {
                        serializeNode(
                            entry.node,
                            entryBuilder,
                            compact,
                        )
                    })
                })
            })
            serializeComments(elementSerializer, $.endComments)

            break
        }
        case "state group": {
            const $ = property.type[1]

            serializeComments(elementSerializer, $.comments)
            elementSerializer.taggedUnion($.getCurrentState().getStateKey(), stateDataBuilder => {
                serializeNode(
                    $.getCurrentState().node,
                    stateDataBuilder,
                    compact,
                )
            })
            break
        }
        case "value": {
            const $ = property.type[1]
            elementSerializer.simpleValue($.getValue(), $.isQuoted)
            serializeComments(elementSerializer, $.comments)

            break
        }
        default:
            assertUnreachable(property.type[0])
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
    serializeComments(valueSerializer, node.beginComments)

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
    serializeComments(valueSerializer, node.endComments)

}

export function serialize(
    serializer: RootSerializer,
    dataset: syncAPI.IDataset,
    internalSchemaSpecification: syncAPI.InternalSchemaSpecification,
    compact: boolean,
): void {
    serializer.serializeHeader(internalSchemaSpecification, compact)
    serializeNode(dataset.root, serializer.root, compact)
}
