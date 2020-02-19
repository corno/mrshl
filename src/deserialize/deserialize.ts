import * as bc from "bass-clarinet"
import * as md from "../metadata"
import { NodeBuilder } from "./api"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

function createPropertyDeserializer(context: bc.IssueContext, propDefinition: md.Property, propKey: string, nodeBuilder: NodeBuilder, isCompact: boolean): bc.ValueHandler {
    switch (propDefinition.type[0]) {
        case "collection": {
            const $ = propDefinition.type[1]
            const collBuilder = nodeBuilder.setCollection(propKey)
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    switch ($$["has instances"][0]) {
                        case "no": {
                            return context.expectDictionary((_key, range) => {
                                throw new bc.RangeError(`unexpected entries`, range)
                            })
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            return context.expectDictionary(_key => {
                                const entry = collBuilder.createEntry()
                                entry.insert() //might be problematic.. insertion before fully initialized
                                return createNodeDeserializer(context, $$$.node, entry.node, isCompact)
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
                            return context.expectDictionary((_key, range) => {
                                throw new bc.RangeError(`unexpected entries`, range)
                            })
                        }
                        case "yes": {
                            const $$$ = $$["has instances"][1]
                            return context.expectDictionary(_key => {
                                const entry = collBuilder.createEntry()
                                entry.insert()
                                return createNodeDeserializer(context, $$$.node, entry.node, isCompact)
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
            return createNodeDeserializer(context, $.type.get().node, componentBuilder.node, isCompact)
        }
        case "state group": {
            const $ = propDefinition.type[1]
            return context.expectTaggedUnionOrArraySurrogate(stateName => {
                const stateDef = $.states.get(stateName) //FIX handle missing state more elegantly
                const state = nodeBuilder.setStateGroup(propKey, stateName)
                return createNodeDeserializer(context, stateDef.node, state.node, isCompact)
            })
        }
        case "value": {

            const $ = propDefinition.type[1]
            switch ($.type[0]) {
                case "number": {
                    return context.expectNumber(value => nodeBuilder.setNumber(propKey, value))
                }
                case "boolean": {
                    return context.expectBoolean(value => nodeBuilder.setBoolean(propKey, value))
                }
                case "string": {
                    return context.expectString(value => nodeBuilder.setString(propKey, value))
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        default:
            return assertUnreachable(propDefinition.type[0])
    }
}

function createNodeDeserializer(context: bc.IssueContext, nodeDefinition: md.Node, nodeBuilder: NodeBuilder, isCompact: boolean): bc.ValueHandler {
    if (isCompact) {
        const expectedElements: bc.ValueHandler[] = []
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedElements.push(((): bc.ValueHandler => {
                return createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, isCompact)
            })())
        })
        return context.expectArrayType(
            expectedElements,
            () => {
                //nothing to do on end
            }
        )

    } else {
        const expectedEntries: { [key: string]: bc.ValueHandler } = {}
        nodeDefinition.properties.forEach((propDefinition, propKey) => {
            expectedEntries[propKey] = createPropertyDeserializer(context, propDefinition, propKey, nodeBuilder, isCompact)
        })
        return context.expectType(
            expectedEntries,
            () => {
                //nothing to do on end
            }
        )

    }

}

export function createDeserializer(metaData: md.Schema, onError: bc.IssueHandler, onWarning: bc.IssueHandler, nodeBuilder: NodeBuilder, isCompact: boolean): bc.DataSubscriber {
    const errorContext = new bc.IssueContext(onError, onWarning)

    return bc.createStackedDataSubscriber(
        createNodeDeserializer(errorContext, metaData["root type"].get().node, nodeBuilder, isCompact),
        (message: string, range: bc.Range) => {
            throw new bc.RangeError(message, range)
        },
        (message: string, location: bc.Location) => {
            throw new bc.LocationError(message, location)
        },
        () => {
            //ignoreEndComments
        }
    )
}
