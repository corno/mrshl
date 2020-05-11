
export interface IReference<T> {
    get(): T
    getName(): string
}

type Resolve = () => boolean

export class ResolveRegistry {
    public readonly references: Resolve[] = []
    public register(reference: Resolve) {
        this.references.push(reference)
    }
    public resolve() {
        let foundErrors = false
        this.references.forEach(r => {
            const success = r()
            if (!success) {
                foundErrors = true
            }
        })
        return !foundErrors
    }
}

export function createReference<T>(name: string, lookup: IReadonlyLookup<T>, resolver: ResolveRegistry, onError: (keys: string[]) => void): IReference<T> {
    let t: T | null = null
    resolver.register(() => {
        t = lookup.get(name)
        if (t === null) {
            onError(lookup.getKeys())
            return false
        }
        return true
    })
    return {
        get: () => {
            if (t === null) {
                throw new Error("UNEXPECTED: not resolved")
            }
            return t
        },
        getName: () => {
            return name
        },
    }
}

export type RawObject<T> = { [key: string]: T }


export interface IReadonlyLookup<T> {
    get(key: string): T | null
    getKeys(): string[]
}


export interface IReadonlyDictionary<T> extends IReadonlyLookup<T> {
    forEach(callback: (entry: T, key: string) => void): void
    isEmpty(): boolean
    mapSorted<RT>(callback: (entry: T, key: string) => RT): RawObject<RT>
    mapUnsorted<RT>(callback: (entry: T, key: string) => RT): RawObject<RT>
}

export class Dictionary<T> implements IReadonlyDictionary<T>, IReadonlyLookup<T> {
    private readonly imp: { [key: string]: T } = {}
    constructor(imp: { [key: string]: T }) {
        this.imp = imp
    }
    public forEach(callback: (entry: T, key: string) => void) {
        Object.keys(this.imp).sort().forEach(key => callback(this.imp[key], key))
    }
    public mapSorted<RT>(callback: (entry: T, key: string) => RT): RawObject<RT> {
        const rt: RawObject<RT> = {}
        Object.keys(this.imp).sort().forEach(key => {
            rt[key] = callback(this.imp[key], key)
        })
        return rt
    }
    public mapUnsorted<RT>(callback: (entry: T, key: string) => RT): RawObject<RT> {
        const rt: RawObject<RT> = {}
        Object.keys(this.imp).forEach(key => {
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
    public get(key: string) {
        const entry = this.imp[key]
        if (entry === undefined) {
            return null
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
