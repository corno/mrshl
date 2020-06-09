import * as g from "../../generics"
import * as d from "../../types"
import { Collection } from "./Collection"
import { Component } from "./Component"
import { StateGroup } from "./StateGroup"
import { Value } from "./Value"

export class Node {
    public readonly collections = new g.Dictionary<Collection>({})
    public readonly components = new g.Dictionary<Component>({})
    public readonly stateGroups = new g.Dictionary<StateGroup>({})
    public readonly values = new g.Dictionary<Value>({})
    public readonly keyProperty: d.Property | null
    constructor(
        keyProperty: null | d.Property,
        initialize: (node: Node) => void,
    ) {
        this.keyProperty = keyProperty
        initialize(this)
    }
}
