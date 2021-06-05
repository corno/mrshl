import { RawObject } from "./RawObject";

export interface IReadonlyLookup<T> {
    getUnsafe(key: string): T
    get(key: string): T | null
    getKeys(): string[]
}

export interface IReadonlyDictionary<T> extends IReadonlyLookup<T> {
    forEach(callback: (entry: T, key: string) => void): void
    mapSorted<RT>(callback: (entry: T, key: string) => RT): RawObject<RT>
    mapUnsorted<RT>(callback: (entry: T, key: string) => RT): RawObject<RT>
}