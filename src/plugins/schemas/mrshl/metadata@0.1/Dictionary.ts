import * as streamVal from "../../../../interfaces/streamingValidationAPI"

export class Dictionary<T> implements streamVal.IReadonlyDictionary<T>, streamVal.IReadonlyLookup<T> {
    private readonly imp: { [key: string]: T } = {}
    constructor(imp: { [key: string]: T }) {
        this.imp = imp
    }
    public forEach(callback: (entry: T, key: string) => void): void {
        Object.keys(this.imp).sort().forEach(key => callback(this.imp[key], key))
    }
    public map<RT>(callback: (entry: T, key: string) => RT): streamVal.RawObject<RT> {
        const rt: streamVal.RawObject<RT> = {}
        Object.keys(this.imp).sort().forEach(key => {
            rt[key] = callback(this.imp[key], key)
        })
        return rt
    }
    public filter<RT>(callback: (entry: T, key: string) => null | RT): Dictionary<RT> {
        const rt: streamVal.RawObject<RT> = {}
        Object.keys(this.imp).sort().forEach(key => {
            const result = callback(this.imp[key], key)
            if (result !== null) {
                rt[key] = result
            }
        })
        return new Dictionary(rt)
    }
    public add(key: string, value: T): void {
        this.imp[key] = value
    }
    public getUnsafe(key: string): T {
        const entry = this.imp[key]
        if (entry === undefined) {
            throw new Error(`no such entry: ${key}, options: ${Object.keys(this.imp).join(", ")}`)
        }
        return entry
    }
    public get(key: string): T | null {
        const entry = this.imp[key]
        if (entry === undefined) {
            return null
        }
        return entry
    }
    public mapSorted<RT>(callback: (entry: T, key: string) => RT): streamVal.RawObject<RT> {
        const rt: streamVal.RawObject<RT> = {}
        Object.keys(this.imp).sort().forEach(key => {
            rt[key] = callback(this.imp[key], key)
        })
        return rt
    }
    public mapUnsorted<RT>(callback: (entry: T, key: string) => RT): streamVal.RawObject<RT> {
        const rt: streamVal.RawObject<RT> = {}
        Object.keys(this.imp).forEach(key => {
            rt[key] = callback(this.imp[key], key)
        })
        return rt
    }
    public isEmpty(): boolean {
        return Object.keys(this.imp).length === 0
    }
    public getKeys(): string[] {
        return Object.keys(this.imp).sort()
    }
}

export class Lookup<T> {
    private readonly imp: { [key: string]: T } = {}
    constructor(imp: { [key: string]: T }) {
        this.imp = imp
    }
    public add(key: string, value: T): void {
        this.imp[key] = value
    }
    public get(key: string): T {
        const entry = this.imp[key]
        if (entry === undefined) {
            throw new Error(`no such entry: ${key}, options: ${Object.keys(this.imp).join(", ")}`)
        }
        return entry
    }
}