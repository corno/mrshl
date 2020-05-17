import * as g from "../generics/index"
import * as bi from "../asynAPI"
import * as d from "../definition/index"
import * as dapi from "../syncAPI"
import { Collection, DictionaryBuilder, ListBuilder, Dictionary, List } from "./Collection"
import { Component, ComponentBuilder } from "./Component"
import { IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { StateGroup, StateGroupBuilder } from "./StateGroup"
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
    constructor(
        _definition: d.Property,
        type: PropertyType,
        isKeyProperty: boolean,
    ) {
        this.type = type
        this.isKeyProperty = isKeyProperty
    }
}

class PropertyBuilder implements dapi.Property {
    private readonly imp: Property
    public readonly type: dapi.PropertyType
    public readonly isKeyProperty: boolean
    constructor(imp: Property) {
        this.imp = imp
        this.type = imp.type
        this.isKeyProperty = this.imp.isKeyProperty
    }
}

export class Node implements bi.Node {
    public readonly collections = new g.Dictionary<Collection>({})
    public readonly dictionaries = new g.Dictionary<Dictionary>({})
    public readonly lists = new g.Dictionary<List>({})
    public readonly components = new g.Dictionary<Component>({})
    public readonly stateGroups = new g.Dictionary<StateGroup>({})
    public readonly values = new g.Dictionary<Value>({})
    private readonly definition: d.Node
    private readonly keyProperty: d.Property | null
    constructor(definition: d.Node, keyProperty: null | d.Property) {
        this.definition = definition
        this.keyProperty = keyProperty
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
                                    ["dictionary", this.getDictionary(pKey)],
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
                                    ["list", this.getList(pKey)],
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
    public getDictionary(key: string) {
        return this.dictionaries.getUnsafe(key)
    }
    public getList(key: string) {
        return this.lists.getUnsafe(key)
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

export function defaultInitializeNode(
    definition: d.Node,
    node: Node,
    global: Global,
    errorsAggregator: IParentErrorsAggregator,
    subentriesErrorsAggregator: IParentErrorsAggregator,
    createdInNewContext: boolean
) {
    definition.properties.forEach((property, key) => {
        switch (property.type[0]) {
            case "collection": {
                const $ = property.type[1]
                const collection = new Collection($, subentriesErrorsAggregator, global)
                node.collections.add(key, collection)
                switch ($.type[0]) {
                    case "dictionary": {
                        const $$ = $.type[1]
                        node.dictionaries.add(key, new Dictionary($$, collection))

                        break
                    }
                    case "list": {
                        node.lists.add(key, new List(collection))

                        break
                    }
                    default:
                        assertUnreachable($.type[0])
                }
                break
            }
            case "component": {
                const $ = property.type[1]
                const comp = new Component($)
                defaultInitializeNode(
                    $.type.get().node,
                    comp.node,
                    global,
                    errorsAggregator,
                    subentriesErrorsAggregator,
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
                    subentriesErrorsAggregator,
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

export class NodeBuilder implements dapi.Node {
    private readonly node: Node
    private readonly definition: d.Node
    private readonly errorsAggregator: IParentErrorsAggregator
    private readonly subEntriesErrorsAggregator: IParentErrorsAggregator
    private readonly global: Global
    private readonly createdInNewContext: boolean
    private readonly keyProperty: d.Property | null
    constructor(
        definition: d.Node,
        node: Node,
        global: Global,
        errorsAggregator: IParentErrorsAggregator,
        subEntriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
        keyProperty: d.Property | null,
    ) {
        this.definition = definition
        this.node = node
        this.errorsAggregator = errorsAggregator
        this.subEntriesErrorsAggregator = subEntriesErrorsAggregator
        this.global = global
        this.createdInNewContext = createdInNewContext
        this.keyProperty = keyProperty
        this.definition.properties.forEach((p, key) => {
            switch (p.type[0]) {
                case "collection": {
                    const $ = p.type[1]
                    const collection = new Collection($, this.errorsAggregator, this.global)
                    this.node.collections.add(key, collection)
                    break
                }
                case "component": {
                    const $ = p.type[1]
                    const component = new Component($)
                    this.node.components.add(key, component)

                    break
                }
                case "state group": {
                    const $ = p.type[1]
                    const stateGroup = new StateGroup($, this.errorsAggregator, this.subEntriesErrorsAggregator, this.global, this.createdInNewContext)
                    this.node.stateGroups.add(key, stateGroup)
                    break
                }
                case "value": {
                    const $ = p.type[1]

                    const val = new Value($, this.errorsAggregator, this.global, this.createdInNewContext)
                    this.node.values.add(key, val)
                    break
                }
                default:
                    assertUnreachable(p.type[0])
            }
        })
    }
    public getDictionary(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "collection") {
            throw new Error("not a collection")
        }
        const $ = propDef.type[1]
        if ($.type[0] !== "dictionary") {
            throw new Error("not a dicionary")
        }
        const dictionary = this.node.dictionaries.getUnsafe(key)
        return new DictionaryBuilder(dictionary, this.createdInNewContext)
    }
    public getList(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "collection") {
            throw new Error("not a collection")
        }
        const $ = propDef.type[1]
        if ($.type[0] !== "list") {
            throw new Error("not a list")
        }
        const list = this.node.lists.getUnsafe(key)
        return new ListBuilder(list, this.createdInNewContext)
    }
    public getComponent(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "component") {
            throw new Error("not a component")
        }
        const component = this.node.components.getUnsafe(key)
        return new ComponentBuilder(
            propDef.type[1],
            component,
            this.global,
            this.errorsAggregator,
            this.subEntriesErrorsAggregator,
            this.createdInNewContext,
            this.keyProperty,
        )
    }
    public getStateGroup(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "state group") {
            throw new Error("not a state group")
        }
        const sg = this.node.getStateGroup(key)

        return new StateGroupBuilder(sg, this.global, this.createdInNewContext)
    }
    public getValue(key: string) {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "value") {
            throw new Error("not a value")
        }
        return this.node.values.getUnsafe(key)
    }
    public forEachProperty(callback: (property: dapi.Property, key: string) => void) {
        this.node.forEachProperty((p, pKey) => {
            callback(new PropertyBuilder(p), pKey)
        })
    }
}
