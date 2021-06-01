import * as g from "../../../generic"
import * as db5api from "../../../db5api"
import { Collection } from "./Collection"
import { Component } from "./Component"
import { StateGroup } from "./StateGroup"
import { Value } from "./Value"

export class Node {
    public readonly collections = new g.Dictionary<Collection>({})
    public readonly components = new g.Dictionary<Component>({})
    public readonly stateGroups = new g.Dictionary<StateGroup>({})
    public readonly values = new g.Dictionary<Value>({})
    public readonly keyProperty: db5api.PropertyDefinition | null

    constructor(
        keyProperty: null | db5api.PropertyDefinition,
        initialize: (node: Node) => void,
    ) {
        this.keyProperty = keyProperty
        initialize(this)
    }
}
