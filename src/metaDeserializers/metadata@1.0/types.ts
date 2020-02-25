import * as g from "./generics"

export type CollectionType =
    | ["dictionary", Dictionary]
    | ["list", List]

export type Collection = {
    readonly "type": CollectionType
}

export type Component = {
    readonly type: g.IReference<ComponentType>
}

export type ComponentType = {
    readonly node: Node
}

export type Dictionary = {
    "has instances": DictionaryHasInstances //FIX this is not 'readonly'
}

export type DictionaryHasInstances =
    | ["no", {}]
    | ["yes", {
        readonly "node": Node
        readonly "key property": g.IReference<Property>
    }]

export type List = {
    "has instances": ListHasInstances //FIX this is not 'readonly'
}

export type ListHasInstances =
    | ["no", {}]
    | ["yes", {
        readonly "node": Node
    }]

export type Node = {
    readonly properties: g.IReadonlyDictionary<Property>
}

export type Property = {
    readonly type: PropertyType
}

export type PropertyType =
    | ["value", Value]
    | ["component", Component]
    | ["collection", Collection]
    | ["state group", StateGroup]

export type Schema = {
    readonly "component types": g.IReadonlyDictionary<ComponentType>
    readonly "root type": g.IReference<ComponentType>
}

export type State = {
    readonly node: Node
}

export type StateGroup = {
    readonly states: g.IReadonlyDictionary<State>
}

export type ValueType =
    | ["string", {}]
    | ["number", {}]
    | ["boolean", {}]

export type Value = {
    readonly type: ValueType
}
