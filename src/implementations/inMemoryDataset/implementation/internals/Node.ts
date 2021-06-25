import * as g from "../genericimp"
import { Collection } from "./Collection"
import { Component } from "./Component"
import { StateGroup } from "./StateGroup"
import { Value } from "./Value"

export class Node {
    public readonly collections = new g.Dictionary<Collection>({})
    public readonly components = new g.Dictionary<Component>({})
    public readonly taggedUnions = new g.Dictionary<StateGroup>({})
    public readonly values = new g.Dictionary<Value>({})

    constructor(
        initialize: (node: Node) => void,
    ) {
        initialize(this)
    }
}
