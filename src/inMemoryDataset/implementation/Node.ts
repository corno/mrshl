import * as g from "../../generics"
import * as asyncAPI from "../../asyncAPI"
import * as d from "../../definition"
import { Collection } from "./Collection"
import { Component } from "./Component"
import { IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { StateGroup } from "./StateGroup"
import { Value } from "./Value"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

export class Property {
    public readonly isKeyProperty: boolean
    public readonly type: asyncAPI.PropertyType
    public readonly definition: d.Property
    constructor(
        definition: d.Property,
        type: asyncAPI.PropertyType,
        isKeyProperty: boolean,
    ) {
        this.definition = definition
        this.type = type
        this.isKeyProperty = isKeyProperty
    }
}

export class Node {
    public readonly collections = new g.Dictionary<Collection>({})
    public readonly components = new g.Dictionary<Component>({})
    public readonly stateGroups = new g.Dictionary<StateGroup>({})
    public readonly values = new g.Dictionary<Value>({})
    public readonly definition: d.Node
    public readonly keyProperty: d.Property | null
    constructor(
        definition: d.Node,
        global: Global,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
        keyProperty: null | d.Property
    ) {
        this.definition = definition
        this.keyProperty = keyProperty

        definition.properties.forEach((property, key) => {
            switch (property.type[0]) {
                case "collection": {
                    const $ = property.type[1]
                    const collection = new Collection($, subEntriesErrorsAggregator, global)
                    this.collections.add(key, collection)
                    break
                }
                case "component": {
                    const $ = property.type[1]
                    const comp = new Component(
                        $,
                        global,
                        errorsAggregator,
                        subEntriesErrorsAggregator,
                        createdInNewContext,
                    )
                    this.components.add(key, comp)
                    break
                }
                case "state group": {
                    const $ = property.type[1]
                    const sg = new StateGroup(
                        $,
                        errorsAggregator,
                        subEntriesErrorsAggregator,
                        global,
                        createdInNewContext,
                    )
                    this.stateGroups.add(key, sg)
                    break
                }
                case "value": {
                    const $ = property.type[1]
                    this.values.add(key, new Value($, errorsAggregator, global, createdInNewContext))
                    break
                }
                default:
                    return assertUnreachable(property.type[0])
            }
        })
    }
}
