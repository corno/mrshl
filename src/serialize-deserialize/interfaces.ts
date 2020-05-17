/* eslint
    "@typescript-eslint/no-empty-interface": off
 */
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
