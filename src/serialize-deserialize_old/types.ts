import * as g from "../generics"

export type Node = {
    readonly properties: g.RawObject<Property>
}

export type Component = {
    readonly type: string
}

export type Property = {
    readonly type: PropertyType
}

export type PropertyType =
    | ["value", {}] //eslint-disable-line @typescript-eslint/ban-types
    | ["component", Component]
    | ["collection", Collection]
    | ["state group", StateGroup]

export type StateGroup = {
    readonly states: g.RawObject<State>
}

export type State = {
    readonly node: Node
}

export type Collection = {
    node: Node
}

export type ComponentType = {
    readonly node: Node
}

export type ComponentTypes = g.RawObject<ComponentType>

export type Schema = {
    readonly "component types": ComponentTypes
    readonly root: Node
}
