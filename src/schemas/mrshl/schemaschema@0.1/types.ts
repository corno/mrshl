import * as g from "../../../generics"

export type CollectionType =
    | ["dictionary", Dictionary]
    | ["list", List]

export type Collection = {
    readonly "node": Node
    readonly "type": CollectionType
}

export type Component = {
    readonly "type": g.IReference<ComponentType>
}

export type ComponentType = {
    readonly "node": Node
}

export type Dictionary = {
    readonly "key property": g.IReference<Property>
}

export type List = {
}

export type Node = {
    readonly "properties": g.Dictionary<Property>
}

export type Property = {
    readonly "type": PropertyType
}

export type PropertyType =
    | ["value", Value]
    | ["component", Component]
    | ["collection", Collection]
    | ["state group", StateGroup]

export type Schema = {
    readonly "component types": g.Dictionary<ComponentType>
    readonly "root type": g.IReference<ComponentType>
}

export type State = {
    readonly "node": Node
}

export type StateGroup = {
    readonly "states": g.Dictionary<State>
    readonly "default state": g.IReference<State>
}

export type ValueType =
    | ["string", {}]
    | ["number", {}]
    | ["boolean", {}]

export type Value = {
    readonly "type": ValueType
    readonly "default value": string
}
