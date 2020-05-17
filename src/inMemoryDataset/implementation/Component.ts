import * as bi from "../../asyncAPI"
import * as d from "../../definition/index"
import { Node } from "./Node"
import { Comments } from "./Comments"

export class Component implements bi.Component {
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(definition: d.Component) {
        this.node = new Node(definition.type.get().node, null)
    }
    public purgeChanges() {
        this.node.purgeChanges()
    }
}

