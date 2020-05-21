import { findInArray } from "./Array"
import { Subscribers, Unsubscriber } from "./Subscribers"

class PrivateReactiveEntry<T> {
    public readonly entry: T
    public readonly deletionSubscribers = new Subscribers<void>()
    constructor(entry: T) {
        this.entry = entry
    }
}

export class ReactiveEntry<T> {
    public readonly entry: T
    private readonly deletionSubscribers: Subscribers<void>
    constructor(entry: T, deletionSubscribers: Subscribers<void>) {
        this.entry = entry
        this.deletionSubscribers = deletionSubscribers
    }
    public subscribeToDeletion(subscriber: () => void) {
        return this.deletionSubscribers.add(subscriber)
    }
}

export interface ISubscribableArray<T> {
    subscribeToEntries(subscriber: (newEntry: ReactiveEntry<T>) => void): Unsubscriber
}

export class ReactiveArray<T> implements ISubscribableArray<T> {
    private readonly entriesSubscribers = new Subscribers<ReactiveEntry<T>>()
    private readonly entries: PrivateReactiveEntry<T>[] = []
    private inForeachLoop = false
    public addEntry(entry: T) {
        const privateEntryWrapper = new PrivateReactiveEntry(entry)
        const index = findInArray(this.entries, e => e.entry === entry)
        index.map(
            _i => {
                throw new Error("Already in array")
            },
            () => {
                this.entries.push(privateEntryWrapper)
                const publicEntry = new ReactiveEntry(entry, privateEntryWrapper.deletionSubscribers)
                this.entriesSubscribers.signal(publicEntry)
            }
        )
    }
    public subscribeToEntries(subscriber: (newEntry: ReactiveEntry<T>) => void) {
        this.entries.forEach(e => {
            const publicEntry = new ReactiveEntry(e.entry, e.deletionSubscribers)
            subscriber(publicEntry)
        })
        return this.entriesSubscribers.add(subscriber)
    }
    public removeEntries(mustBeDeletedCallback: (t: T) => boolean) {
        let i = 0
        while (i !== this.entries.length) {
            const entry = this.entries[i]
            if (mustBeDeletedCallback(entry.entry)) {
                this.entries.splice(i, 1)
                entry.deletionSubscribers.signal()
            } else {
                i++
            }
        }
    }
    public getEntry(condition: (t: T) => boolean): null | T {
        const index = findInArray(this.entries, e => condition(e.entry))
        return index.map(
            i => {
                return this.entries[i].entry
            },
            () => null,
        )
    }
    public removeEntry(t: T) {
        if (this.inForeachLoop) {
            throw new Error("Don't use 'removeEntry' in forEach or map loop, use 'removeEntries'")
        }
        this.removeEntries(c => c === t)
    }
    public forEach(callback: (e: T) => void) {
        this.inForeachLoop = true
        this.entries.forEach(e => callback(e.entry))
        this.inForeachLoop = false
    }
    public mapToRawArray<NT>(callback: (e: T) => NT): NT[] {
        this.inForeachLoop = true
        const x = this.entries.map(e => callback(e.entry))
        this.inForeachLoop = false
        return x
    }
    public map<NT>(callback: (e: T) => NT): ReactiveArray<NT> {
        this.inForeachLoop = true
        const newArray = new ReactiveArray<NT>()
        this.entries.forEach(e => newArray.addEntry(callback(e.entry)))
        this.inForeachLoop = false
        return newArray
    }
}
