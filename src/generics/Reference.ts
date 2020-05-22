import {
    IReadonlyLookup,
} from "./Dictionary"

export interface IReference<T> {
    get(): T
    readonly name: string
}

type Resolve = () => boolean

export class ResolveRegistry {
    public readonly references: Resolve[] = []
    public register(reference: Resolve): void {
        this.references.push(reference)
    }
    public resolve(): boolean {
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
        get: (): T => {
            if (t === null) {
                throw new Error("UNEXPECTED: not resolved")
            }
            return t
        },
        name: name,
    }
}