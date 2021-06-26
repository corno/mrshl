
export interface IReference<T> {
    get(): T
    readonly name: string
}

export interface IReadonlyLookup<T> {
    getUnsafe(key: string): T
    get(key: string): T | null
    getKeys(): string[]
}

export type RawObject<T> = { [key: string]: T }

export interface IReadonlyDictionary<T> extends IReadonlyLookup<T> {
    forEach(callback: (entry: T, key: string) => void): void
    map<RT>(callback: (entry: T) => RT): RawObject<RT>
    toArray<RT>(callback: (entry: T, key: string) => RT): RT[]
}

export type CollectionType =
    | ["dictionary", Dictionary]
    | ["list", List]

export type Collection = {
    readonly "node": Node
    readonly "type": CollectionType
}

export type Component = {
    readonly "type": IReference<ComponentType>
}

export type ComponentType = {
    readonly "node": Node
}

export type Dictionary = {
    readonly "key property": IReference<Property>
}

export type List = {
}

export type Node = {
    readonly "properties": IReadonlyDictionary<Property>
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
    readonly "component types": IReadonlyDictionary<ComponentType>
    readonly "root type": IReference<ComponentType>
}

export type State = {
    readonly "node": Node
}

export type StateGroup = {
    readonly "states": IReadonlyDictionary<State>
    readonly "default state": IReference<State>
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
