import * as def from "../../../deserialize/interfaces/typedParserDefinitions"
import { checkDuplicates } from "./asyncAPIImplementation"
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
            case "dictionary": {
                const $ = property.type[1]
                const collection = new Collection(
                    { type: ["dictionary", $] },
                    subEntriesErrorsAggregator,
                    new Dictionary(
                        property.type[1].key,
                        (oldValue: string, newValue: string) => {
                            checkDuplicates(collection, oldValue)
                            checkDuplicates(collection, newValue)
                        },
                    ),
                )
                node.collections.add(key, collection)
                break
            }
            case "list": {
                const $ = property.type[1]
                const collection = new Collection(
                    { type: ["list", $] },
                    subEntriesErrorsAggregator,
                    null,
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
            case "simple string": {
                const $ = property.type[1]
                node.values.add(key, new Value($, errorsAggregator, createdInNewContext, errorManager))
                break
            }
            case "multiline string": {
                throw new Error("IMPLEMENT ME")
                // const $ = property.type[1]
                // node.values.add(key, new Value($, errorsAggregator, createdInNewContext, errorManager))
                // break
            }
            default:
                return assertUnreachable(property.type[0])
        }
    })
}