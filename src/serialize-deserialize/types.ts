import * as g from "../generics/index"

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
    | ["value", {}]
    | ["component", Component]
    | ["collection", Collection]
    | ["state group", StateGroup]

export type StateGroup = {
    readonly states: g.RawObject<State>
}

export type State = {
    readonly node: Node
}

export type HasInstances =
    | ["no", {}]
    | ["yes", {
        node: Node
    }]

export type Collection = {
    "has instances": HasInstances //FIX this is not 'readonly'
}

export type ComponentType = {
    readonly node: Node
}

export type ComponentTypes = g.RawObject<ComponentType>

export type Schema = {
    readonly "component types": ComponentTypes
    readonly root: Node
}
