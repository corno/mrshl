import * as streamVal from "../../interfaces/streamingValidationAPI"
import * as cc from "./changeControl"
import { Collection, Dictionary, Node } from "./implementation"
import { Component } from "./implementation/Component"
import { IParentErrorsAggregator, ErrorManager } from "./implementation/ErrorManager"
import { StateGroup } from "./implementation/StateGroup"
import { Value } from "./implementation/Value"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

export function initializeNode(
    node: Node,
    definition: streamVal.NodeDefinition,
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
            case "state group": {
                const $ = property.type[1]
                const sg = new StateGroup(
                    $,
                    errorManager,
                    errorsAggregator,
                    subEntriesErrorsAggregator,
                    createdInNewContext,
                )
                node.stateGroups.add(key, sg)
                break
            }
            case "value": {
                const $ = property.type[1]
                node.values.add(key, new Value($, errorsAggregator, createdInNewContext, errorManager))
                break
            }
            default:
                return assertUnreachable(property.type[0])
        }
    })
}