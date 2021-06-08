import * as def from "../../../interfaces/typedParserDefinitions"
import * as cc from "./changeControl"
import { Collection, Dictionary, Node } from "./internals"
import { Component } from "./internals/Component"
import { IParentErrorsAggregator, ErrorManager } from "./internals/ErrorManager"
import { StateGroup } from "./internals/StateGroup"
import { Value } from "./internals/Value"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

export function initializeNode(
    node: Node,
    definition: def.NodeDefinition,
    errorManager: ErrorManager,
    errorsAggregator: IParentErrorsAggregator,
    subEntriesErrorsAggregator: IParentErrorsAggregator,
    createdInNewContext: boolean,
): void {
    definition.properties.forEach((property, key) => {
        switch (property.type[0]) {
            case "collection": {
                const $ = property.type[1]
                const collection = new Collection(
                    $,
                    subEntriesErrorsAggregator,
                    ((): Dictionary | null => {
                        if ($.type[0] === "dictionary") {
                            const $$ = $.type[1]
                            return new Dictionary(
                                $.type[1]["key property"].name,
                                $.type[1]["key property"].get(),
                                (oldValue: string, newValue: string) => {
                                    cc.checkDuplicates(collection, oldValue, $$["key property"].name)
                                    cc.checkDuplicates(collection, newValue, $$["key property"].name)
                                },
                            )
                        } else {
                            return null
                        }
                    })()
                )
                node.collections.add(key, collection)
                break
            }
            case "component": {
                const $ = property.type[1]
                const comp = new Component(
                    $,
                    errorManager,
                    errorsAggregator,
                    subEntriesErrorsAggregator,
                    createdInNewContext,
                )
                node.components.add(key, comp)
                break
            }
            case "tagged union": {
                const $ = property.type[1]
                const sg = new StateGroup(
                    $,
                    errorManager,
                    errorsAggregator,
                    subEntriesErrorsAggregator,
                    createdInNewContext,
                )
                node.taggedUnions.add(key, sg)
                break
            }
            case "string": {
                const $ = property.type[1]
                node.values.add(key, new Value($, errorsAggregator, createdInNewContext, errorManager))
                break
            }
            default:
                return assertUnreachable(property.type[0])
        }
    })
}