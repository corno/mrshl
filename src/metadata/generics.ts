
export interface IReference<T> {
    get(): T
    getName(): string
}

export function createReference<T>(name: string, getter: () => T): IReference<T> {
    return {
        get: () => {
            return getter()
        },
        getName: () => {
            return name
        },
    }
}

export type RawObject<T> = { [key: string]: T }

export interface IReadonlyDictionary<T> {
    forEach(callback: (entry: T, key: string) => void): void
    get(key: string, onNotExists?: () => T): T
    isEmpty(): boolean
}

export interface IReadonlyLookup<T> {
    get(key: string): T
}

export class Dictionary<T> implements IReadonlyDictionary<T>, IReadonlyLookup<T> {
    private readonly imp: { [key: string]: T } = {}
    constructor(imp: { [key: string]: T }) {
        this.imp = imp
    }
    public forEach(callback: (entry: T, key: string) => void) {
        Object.keys(this.imp).sort().forEach(key => callback(this.imp[key], key))
    }
    public map<RT>(callback: (entry: T, key: string) => RT): RawObject<RT> {
        const rt: RawObject<RT> = {}
        Object.keys(this.imp).sort().forEach(key => {
            rt[key] = callback(this.imp[key], key)
        })
        return rt
    }
    public filter<RT>(callback: (entry: T, key: string) => null | RT): Dictionary<RT> {
        const rt: RawObject<RT> = {}
        Object.keys(this.imp).sort().forEach(key => {
            const result = callback(this.imp[key], key)
            if (result !== null) {
                rt[key] = result
            }
        })
        return new Dictionary(rt)
    }
    public add(key: string, value: T) {
        this.imp[key] = value
    }
    public get(key: string, onNotExists?: () => T) {
        const entry = this.imp[key]
        if (entry === undefined) {
            if (onNotExists) {
                return onNotExists()
            }
            throw new Error(`no such entry: ${key}, options: ${Object.keys(this.imp).join(", ")}`)
        }
        return entry
    }
    public with<RT>(key: string, ifNotExists: () => RT, ifExists: (t: T) => RT): RT {
        const entry = this.imp[key]
        if (entry === undefined) {
            return ifNotExists()
        }
        return ifExists(entry)
    }
    public has(key: string) {
        const entry = this.imp[key]
        return entry !== undefined
    }
    public getKeys() {
        return Object.keys(this.imp).sort()
    }
    public isEmpty() {
        return Object.keys(this.imp).length === 0
    }
}
