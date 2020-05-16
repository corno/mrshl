import * as g from "../generics/raw"

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
    readonly "key property": string
}

export type List = {

}

export type Node = {
    readonly properties: g.IReadonlyDictionary<Property>
}

export type Property = {
    readonly label: string
    readonly type: PropertyType
}

export type PropertyType =
    | ["component", Component]
    | ["collection", Collection]
    | ["state group", StateGroup]
    | ["value", Value]

export type Schema = {
    readonly root: Node
    readonly "component types": g.IReadonlyDictionary<ComponentType>
}

export type State = {
    readonly key: string
    readonly label: string
    readonly node: Node
}

export type StateGroup = {
    readonly states: g.IReadonlyDictionary<State>
    readonly "default state": g.IReference<State>
}

export type TextProperty = {
}

export type Value = {
    readonly "default value": string
    readonly type: ValueType
}

export type ValueType =
    | ["number", {
    }]
    | ["text", TextProperty]
