// tslint:disable: interface-name
import * as g from "../generics/index"

export interface SerializableNode {
    getCollection(name: string): SerializableCollection
    getComponent(name: string): SerializableComponent
    getStateGroup(name: string): SerializableStateGroup
    getValue(name: string): SerializableValue
    forEachProperty(callback: (entry: SerializableProperty, key: string) => void): void
}

export type SerializablePropertyType =
    | ["list", SerializableCollection]
    | ["dictionary", SerializableCollection]
    | ["component", SerializableComponent]
    | ["state group", SerializableStateGroup]
    | ["value", SerializableValue]

export interface SerializableProperty {
    readonly isKeyProperty: boolean
    readonly type: SerializablePropertyType
}


export interface SerializableValue {
    getValue(): string
    readonly isQuoted: boolean
}

export interface SerializableEntry {
    readonly node: SerializableNode
}

export interface SerializableCollection {
    forEachEntry(callback: (entry: SerializableEntry) => void): void
}

export interface SerializableComponent {
    readonly node: SerializableNode
}

export interface SerializableStateGroup {
    getCurrentState(): SerializableState
}

export interface SerializableState {
    readonly node: SerializableNode
    getStateKey(): string
}


export interface ArrayAPI {
    readonly array: null
}

export interface ObjectAPI {
    readonly object: null
}

export interface ValueAPI {
    readonly value: null
}

export interface Deserializer {
    castToString(v: ValueAPI): string

    castToObject(v: ValueAPI): ObjectAPI
    mapObject<T>(source: ObjectAPI, callback: (entry: ValueAPI, key: string) => T): g.RawObject<T>
    getEntry(source: ObjectAPI, key: string): ValueAPI

    castToArray(v: ValueAPI): ArrayAPI
    mapArray<T>(source: ArrayAPI, callback: (entry: ValueAPI, index: number) => T): T[]
    getElement(source: ArrayAPI, index: number): ValueAPI
    assertArrayLength(source: ArrayAPI, length: number): void
}

export interface NodeBuilder {
    addCollection(name: string): CollectionBuilder
    addComponent(name: string): ComponentBuilder
    addStateGroup(name: string, stateName: string): StateBuilder
    addValue(name: string, value: string): void
}

export interface ComponentBuilder {
    node: NodeBuilder
}

export interface EntryBuilder {
    node: NodeBuilder
    insert(): void
}
export interface StateBuilder {
    node: NodeBuilder
}

export interface CollectionBuilder {
    createEntry(): EntryBuilder
}

