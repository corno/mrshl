import * as md from "../internalSchema"
import { NodeBuilder, NodeValidator } from "./api"
import * as bc from "bass-clarinet"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function createPropertyDeserializer(
    context: bc.ExpectContext,
    propDefinition: md.Property,
    propKey: string,
    nodeBuilder: NodeBuilder,
    nodeValidator: NodeValidator,
    isCompact: boolean
): bc.ValueHandler {
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

                                const collValidator = nodeValidator.setCollection(propKey, range, comments)

                                const entryValidator = collValidator.createEntry()
                                entryValidator.insert() //might be problematic.. insertion before fully initialized

                                return createNodeDeserializer(
                                    context,
                                    $$$.node,
                                    entry.node,
                                    entryValidator.node,
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


                                const collValidator = nodeValidator.setCollection(propKey, range, comments)

                                const entryValidator = collValidator.createEntry()
                                entryValidator.insert()

                                return createNodeDeserializer(
                                    context,
                                    $$$.node,
                                    entry.node,
                                    entryValidator.node,
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
            const componentValidator = nodeValidator.setComponent(propKey)
            return createNodeDeserializer(
                context,
                $.type.get().node,
                componentBuilder.node,
                componentValidator.node,
                isCompact,
            )
        }
        case "state group": {
            const $ = propDefinition.type[1]
            return context.expectTaggedUnion($.states.map((stateDef, stateName) => {
                return (startRange, tuComments, optionRange, optionComments) => {
                    const state = nodeBuilder.setStateGroup(propKey, stateName, startRange, tuComments, optionRange, optionComments)
                    const stateValidator = nodeValidator.setStateGroup(propKey, stateName, startRange, tuComments, optionRange, optionComments)
                    return createNodeDeserializer(context, stateDef.node, state.node, stateValidator.node, isCompact)
                }
            }))
        }
        case "value": {
            return context.expectSimpleValue((value, quoted, range, comments) => {
                nodeBuilder.setSimpleValue(propKey, value, quoted, range, comments)
                nodeValidator.setSimpleValue(propKey, value, quoted, range, comments)
            })
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

export function createNodeDeserializer(context: bc.ExpectContext, nodeDefinition: md.Node, nodeBuilder: NodeBuilder, nodeValidator: NodeValidator, isCompact: boolean): bc.ValueHandler {
    if (isCompact) {
        const expectedElements: (() => bc.ValueHandler)[] = []
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedElements.push(((): () => bc.ValueHandler => {
                return () => createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, nodeValidator, isCompact)
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
        const expectedProperties: bc.ExpectedProperties = {}
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedProperties[propKey] = {
                onExists: () => createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, nodeValidator, isCompact),
                onNotExists: null,
            }
        })
        return context.expectType(
            _startRange => {
                //
            },
            expectedProperties,
            () => {
                //nothing to do on end
            }
        )

    }

}
