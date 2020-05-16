
export interface IReference<T> {
    get(): T
    readonly name: string
}

export function createReference<T>(name: string, getter: () => T): IReference<T> {
    return {
        get: () => {
            return getter()
        },
        name: name,
    }
}

export interface IReadonlyDictionary<T> {
    forEach(callback: (entry: T, key: string) => void): void
    get(key: string): T
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
    public get(key: string) {
        const entry = this.imp[key]
        if (entry === undefined) {
            throw new Error(`no such entry: ${key}, options: ${Object.keys(this.imp).join(", ")}`)
        }
        return entry
    }
}

export class Lookup<T> {
    private readonly imp: { [key: string]: T } = {}
    constructor(imp: { [key: string]: T }) {
        this.imp = imp
    }
    public add(key: string, value: T) {
        this.imp[key] = value
    }
    public get(key: string) {
        const entry = this.imp[key]
        if (entry === undefined) {
            throw new Error(`no such entry: ${key}, options: ${Object.keys(this.imp).join(", ")}`)
        }
        return entry
    }
}

//export function createDictionary()

export function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

export function findInArray<T>(array: T[], callback: (element: T) => boolean): Maybe<number> {
    for (let i = 0; i !== array.length; i++) {
        if (callback(array[i])) {
            return new Maybe(i)
        }
    }
    return new Maybe<number>(null)
}

export function removeFromArray<T>(array: T[], callback: (element: T) => boolean) {
    const index = findInArray(array, callback)
    index.map(
        i => array.splice(i, 1),
        () => console.error("entry not in array")
    )
    const index2 = findInArray(array, callback)
    index2.ifExists(() => {
        console.error("entry was more than once in the array")
    })
}

//export interface Array<T> {}

export function createArray<T>(): T[] {
    return []
}

export class Mutable<T> {
    private t: T
    constructor(t: T) {
        this.t = t
    }
    public update(t: T) {
        this.t = t
    }
    public get() {
        return this.t
    }
}

export type RawObject<T> = { [key: string]: T }

export class Maybe<T> {
    private readonly t: T | null
    constructor(t: T | null) {
        this.t = t
    }
    public ifExists(callback: (t: T) => void) {
        if (this.t !== null) {
            callback(this.t)
        }
    }
    public map<RT>(onExists: (t: T) => RT, onNotExists: () => RT): RT {
        if (this.t === null) {
            return onNotExists()
        } else {
            return onExists(this.t)
        }
    }
}
