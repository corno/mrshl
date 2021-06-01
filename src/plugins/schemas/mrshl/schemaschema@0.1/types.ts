import * as db5api from "../../../../db5api"

export interface X {
    x: string
}

export type CollectionType =
    | ["dictionary", Dictionary]
    | ["list", List]

export type Collection = {
    readonly "node": Node
    readonly "type": CollectionType
}

export type Component = {
    readonly "type": db5api.IReference<ComponentType>
}

export type ComponentType = {
    readonly "node": Node
}

export type Dictionary = {
    readonly "key property": db5api.IReference<Property>
}

export type List = {
}

export type Node = {
    readonly "properties": db5api.IReadonlyDictionary<Property>
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
    readonly "component types": db5api.IReadonlyDictionary<ComponentType>
    readonly "root type": db5api.IReference<ComponentType>
}

export type State = {
    readonly "node": Node
}

export type StateGroup = {
    readonly "states": db5api.IReadonlyDictionary<State>
    readonly "default state": db5api.IReference<State>
}

export type ValueType =
    | ["string", {
        //
    }]
    | ["number", {
        //
    }]
    | ["boolean", {
        //
    }]

export type Value = {
    readonly "type": ValueType
    readonly "default value": string
}
