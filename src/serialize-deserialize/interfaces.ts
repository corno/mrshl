// tslint:disable: interface-name
import * as g from "../generics/index"

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
    getCollection(name: string): CollectionBuilder
    getComponent(name: string): ComponentBuilder
    getStateGroup(name: string): StateGroupBuilder
    getValue(name: string): ValueBuilder
}

export interface ValueBuilder {
    setValue(value: string): void
}

export interface ComponentBuilder {
    node: NodeBuilder
}

export interface EntryBuilder {
    node: NodeBuilder
    insert(): void
}

export interface StateGroupBuilder {
    setState(stateName: string): StateBuilder
}

export interface StateBuilder {
    node: NodeBuilder
}

export interface CollectionBuilder {
    createEntry(): EntryBuilder
}

