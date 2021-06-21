import * as def from "../../../../interfaces/typedParserDefinitions"

export type CollectionType =
    | ["dictionary", Dictionary]
    | ["list", List]

export type Collection = {
    readonly "node": Node
    readonly "type": CollectionType
}

export type Component = {
    readonly "type": def.IReference<ComponentType>
}

export type ComponentType = {
    readonly "node": Node
}

export type Dictionary = {
    readonly "key property": def.IReference<Property>
}

export type List = {
}

export type Node = {
    readonly "properties": def.IReadonlyDictionary<Property>
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
    readonly "component types": def.IReadonlyDictionary<ComponentType>
    readonly "root type": def.IReference<ComponentType>
}

export type State = {
    readonly "node": Node
}

export type StateGroup = {
    readonly "states": def.IReadonlyDictionary<State>
    readonly "default state": def.IReference<State>
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
