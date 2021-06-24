export type RawObject<T> = { [key: string]: T }

export interface IReadonlyLookup<T> {
    getUnsafe(key: string): T
    get(key: string): T | null
    getKeys(): string[]
}

export interface IReadonlyDictionary<T> extends IReadonlyLookup<T> {
    forEach(callback: (entry: T, key: string) => void): void
    map<RT>(callback: (entry: T) => RT): RawObject<RT>
    toArray<RT>(callback: (entry: T, key: string) => RT): RT[]
}