import * as g from "../generics/index"

export type Collection = {
    readonly node: Node
    readonly type: CollectionType
}

export type CollectionType =
    | ["dictionary", Dictionary]
    | ["list", List]

export type Component = {
    readonly type: g.IReference<ComponentType>
}

export type ComponentType = {
    readonly node: Node
}

export type Dictionary = {
    readonly "key property": g.IReference<Property>
}

export type List = {

}

export type Node = {
    readonly properties: g.IReadonlyDictionary<Property>
}

export type Property = {
    readonly type: PropertyType
}

export type PropertyType =
    | ["collection", Collection]
    | ["component", Component]
    | ["state group", StateGroup]
    | ["value", Value]

export type Schema = {
    readonly "component types": g.IReadonlyDictionary<ComponentType>
    readonly "root type": g.IReference<ComponentType>
}

export type State = {
    readonly label: string
    readonly node: Node
}

export type StateGroup = {
    readonly states: g.IReadonlyDictionary<State>
    readonly "default state": g.IReference<State>
}

export type Value = {
    readonly "default value": string
}