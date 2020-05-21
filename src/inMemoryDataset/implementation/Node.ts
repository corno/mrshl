import * as g from "../../generics"
import * as bi from "../../asyncAPI"
import * as d from "../../definition"
import { Collection, Dictionary, List } from "./Collection"
import { Component } from "./Component"
import { IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { StateGroup } from "./StateGroup"
import { Value } from "./Value"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

export type PropertyType =
    | ["list", List]
    | ["dictionary", Dictionary]
    | ["component", Component]
    | ["state group", StateGroup]
    | ["value", Value]

export class Property {
    public readonly isKeyProperty: boolean
    public readonly type: PropertyType
    public readonly definition: d.Property
    constructor(
        definition: d.Property,
        type: PropertyType,
        isKeyProperty: boolean,
    ) {
        this.definition = definition
        this.type = type
        this.isKeyProperty = isKeyProperty
    }
}

export class Node implements bi.Node {
    public readonly collections = new g.Dictionary<Collection>({})
    public readonly components = new g.Dictionary<Component>({})
    public readonly stateGroups = new g.Dictionary<StateGroup>({})
    public readonly values = new g.Dictionary<Value>({})
    private readonly definition: d.Node
    private readonly keyProperty: d.Property | null
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


        defaultInitializeNode(
            definition,
            this,
            global,
            errorsAggregator,
            subEntriesErrorsAggregator,
            createdInNewContext,
        )
    }
    public forEachProperty(callback: (property: Property, key: string) => void) {
        this.definition.properties.forEach((p, pKey) => {
            const isKeyProperty = this.keyProperty === null ? false : p === this.keyProperty
            switch (p.type[0]) {
                case "collection": {
                    const $ = p.type[1]
                    switch ($.type[0]) {
                        case "dictionary": {
                            callback(
                                new Property(
                                    p,
                                    ["dictionary", new Dictionary($.type[1], this.getCollection(pKey))],
                                    isKeyProperty,
                                ),
                                pKey
                            )
                            break
                        }
                        case "list": {
                            callback(
                                new Property(
                                    p,
                                    ["list", new List($.type[1], this.getCollection(pKey))],
                                    isKeyProperty,
                                ),
                                pKey
                            )
                            break
                        }
                        default:
                            assertUnreachable($.type[0])
                    }
                    break
                }
                case "component": {
                    callback(
                        new Property(
                            p,
                            ["component", this.getComponent(pKey)],
                            isKeyProperty,
                        ),
                        pKey
                    )
                    break
                }
                case "state group": {
                    callback(
                        new Property(
                            p,
                            ["state group", this.getStateGroup(pKey)],
                            isKeyProperty,
                        ),
                        pKey
                    )
                    break
                }
                case "value": {
                    callback(
                        new Property(
                            p,
                            ["value", this.getValue(pKey)],
                            isKeyProperty,
                        ),
                        pKey
                    )
                    break
                }
                default:
                    assertUnreachable(p.type[0])
            }
        })
    }
    public getCollection(key: string) {
        return this.collections.getUnsafe(key)
    }
    public getComponent(key: string) {
        return this.components.getUnsafe(key)
    }
    public getStateGroup(key: string) {
        return this.stateGroups.getUnsafe(key)
    }
    public getValue(key: string) {
        return this.values.getUnsafe(key)
    }
    public purgeChanges() {
        this.collections.forEach(c => c.purgeChanges())
        this.components.forEach(c => c.purgeChanges())
        this.stateGroups.forEach(sg => sg.purgeChanges())
        this.values.forEach(v => v.purgeChanges())
    }
}

function defaultInitializeNode(
    definition: d.Node,
    node: Node,
    global: Global,
    errorsAggregator: IParentErrorsAggregator,
    subEntriesErrorsAggregator: IParentErrorsAggregator,
    createdInNewContext: boolean
) {
    definition.properties.forEach((property, key) => {
        switch (property.type[0]) {
            case "collection": {
                const $ = property.type[1]
                const collection = new Collection($, subEntriesErrorsAggregator, global)
                node.collections.add(key, collection)
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
                defaultInitializeNode(
                    $.type.get().node,
                    comp.node,
                    global,
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
                    errorsAggregator,
                    subEntriesErrorsAggregator,
                    global,
                    createdInNewContext,
                )
                node.stateGroups.add(key, sg)
                break
            }
            case "value": {
                const $ = property.type[1]
                node.values.add(key, new Value($, errorsAggregator, global, createdInNewContext))
                break
            }
            default:
                return assertUnreachable(property.type[0])
        }
    })
}
