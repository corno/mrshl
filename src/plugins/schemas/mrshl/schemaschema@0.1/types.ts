import * as streamVal from "../../../../interfaces/streamingValidationAPI"

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
    readonly "type": streamVal.IReference<ComponentType>
}

export type ComponentType = {
    readonly "node": Node
}

export type Dictionary = {
    readonly "key property": streamVal.IReference<Property>
}

export type List = {
}

export type Node = {
    readonly "properties": streamVal.IReadonlyDictionary<Property>
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
    readonly "component types": streamVal.IReadonlyDictionary<ComponentType>
    readonly "root type": streamVal.IReference<ComponentType>
}

export type State = {
    readonly "node": Node
}

export type StateGroup = {
    readonly "states": streamVal.IReadonlyDictionary<State>
    readonly "default state": streamVal.IReference<State>
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
