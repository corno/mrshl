import * as g from "./generics"

/**
 * this set of types defines a schema that only describes the data structure,
 * not any additional validation rules to which a dataset should confirm.
 * The DB5 database requires an instance of this schema to load the data
 */

export type Collection = {
    readonly "type": CollectionType
}

export type CollectionType =
    | ["dictionary", Dictionary]
    | ["list", List]

export type Component = {
    readonly "type": g.IReference<ComponentType>
}

export type ComponentType = {
    readonly "node": Node
}

export type Dictionary = {
    readonly "key property": g.IReference<Property>
    readonly "node": Node
}

export type List = {
    readonly "node": Node
}

export type Node = {
    readonly "properties": g.IReadonlyDictionary<Property>
}

export type Property = {
    readonly "type": PropertyType
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
    readonly "node": Node
}

export type StateGroup = {
    readonly "states": g.IReadonlyDictionary<State>
    readonly "default state": g.IReference<State>
}

export type Value = {
    readonly "default value": string
    readonly "quoted": boolean
}
