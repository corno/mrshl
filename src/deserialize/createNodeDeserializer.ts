import * as md from "../internalSchema"
import { NodeBuilder } from "./api"
import * as bc from "bass-clarinet"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function createPropertyDeserializer(context: bc.ExpectContext, propDefinition: md.Property, propKey: string, nodeBuilder: NodeBuilder, isCompact: boolean): bc.ValueHandler {
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectDictionary(_key => {
                                return context.expectNothing()
                            })
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            return context.expectDictionary((_key, range, comments) => {
                                const collBuilder = nodeBuilder.setCollection(propKey, range, comments)

                                const entry = collBuilder.createEntry()
                                entry.insert() //might be problematic.. insertion before fully initialized
                                return createNodeDeserializer(
                                    context,
                                    $$$.node,
                                    entry.node,
                                    isCompact
                                )
                            })
                        }
                        default:
                            return assertUnreachable($$["has instances"][0])
                    }
                }
                case "list": {
                    const $$ = $.type[1]

                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectList(_key => {
                                return context.expectNothing()
                            })
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            return context.expectList((range, comments) => {
                                const collBuilder = nodeBuilder.setCollection(propKey, range, comments)

                                const entry = collBuilder.createEntry()
                                entry.insert()
                                return createNodeDeserializer(
                                    context,
                                    $$$.node,
                                    entry.node,
                                    isCompact
                                )
                            })
                        }
                        default:
                            return assertUnreachable($$["has instances"][0])
                    }
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = propDefinition.type[1]
            const componentBuilder = nodeBuilder.setComponent(propKey)
            return createNodeDeserializer(
                context,
                $.type.get().node,
                componentBuilder.node,
                isCompact,
            )
        }
        case "state group": {
            const $ = propDefinition.type[1]
            return context.expectTaggedUnion($.states.map((stateDef, stateName) => {
                return (startRange, tuComments, optionRange, optionComments) => {
                    const state = nodeBuilder.setStateGroup(propKey, stateName, startRange, tuComments, optionRange, optionComments)
                    return createNodeDeserializer(context, stateDef.node, state.node, isCompact)
                }
            }))
        }
        case "value": {

            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "number": {
                    return context.expectNumber((value, range, comments) => nodeBuilder.setNumber(propKey, value, range, comments))
                }
                case "boolean": {
                    return context.expectBoolean((value, range, comments) => nodeBuilder.setBoolean(propKey, value, range, comments))
                }
                case "string": {
                    return context.expectString((value, range, comments) => nodeBuilder.setString(propKey, value, range, comments))
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

export function createNodeDeserializer(context: bc.ExpectContext, nodeDefinition: md.Node, nodeBuilder: NodeBuilder, isCompact: boolean): bc.ValueHandler {
    if (isCompact) {
        const expectedElements: (() => bc.ValueHandler)[] = []
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedElements.push(((): () => bc.ValueHandler => {
                return () => createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, isCompact)
            })())
        })
        return context.expectArrayType(
            _startRange => {
                //
            },
            expectedElements,
            () => {
                //nothing to do on end
            }
        )

    } else {
        const expectedEntries: { [key: string]: () => bc.ValueHandler } = {}
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedEntries[propKey] = () => createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, isCompact)
        })
        return context.expectType(
            _startRange => {
                //
            },
            expectedEntries,
            () => {
                //nothing to do on end
            }
        )

    }

}
