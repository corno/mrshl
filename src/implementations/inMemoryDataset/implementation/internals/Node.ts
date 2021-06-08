import * as g from "../genericimp"
import * as def from "../../../../interfaces/typedParserDefinitions"
import { Collection } from "./Collection"
import { Component } from "./Component"
import { StateGroup } from "./StateGroup"
import { Value } from "./Value"

export class Node {
    public readonly collections = new g.Dictionary<Collection>({})
    public readonly components = new g.Dictionary<Component>({})
    public readonly taggedUnions = new g.Dictionary<StateGroup>({})
    public readonly values = new g.Dictionary<Value>({})
    public readonly keyProperty: def.PropertyDefinition | null

    constructor(
        keyProperty: null | def.PropertyDefinition,
        initialize: (node: Node) => void,
    ) {
        this.keyProperty = keyProperty
        initialize(this)
    }
}
