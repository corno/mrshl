import * as cc from "../changeControl/ChangeController"
import { Collection, EntryPlaceholder, addEntry } from "../implementation"
import * as g from "../../generics"

function attachKey(collection: Collection, entry: EntryPlaceholder) {
    if (collection.dictionary !== null) {

        const cd = collection.dictionary

        const keyValue = entry.node.values.getUnsafe(collection.dictionary.keyPropertyName)
        checkDuplicates(collection, keyValue.value.get(), cd.keyPropertyName)
        if (cd.duplicatesCheckFunction !== null) {
            throw new Error("unexpeded")
        }
        cd.duplicatesCheckFunction = (oldValue: string, newValue: string) => {
            checkDuplicates(collection, oldValue, cd.keyPropertyName)
            checkDuplicates(collection, newValue, cd.keyPropertyName)
        }
        keyValue.changeSubscribers.push(cd.duplicatesCheckFunction)
    }
}

export function checkDuplicates(collection: Collection, key: string, keyPropertyName: string) {
    const matches = collection.entries.mapToRawArray(e => e).filter(e => {
        //if it is removed, it is never a duplicate
        if (e.status.get()[0] === "inactive") {
            return false
        }
        return e.node.values.getUnsafe(keyPropertyName).value.get() === key
    })
    if (matches.length > 1) {
        matches.forEach(m => {
            m.entry.node.values.getUnsafe(keyPropertyName).isDuplicateImp.update(true)
        })
    }
    if (matches.length === 1) {
        matches[0].entry.node.values.getUnsafe(keyPropertyName).isDuplicateImp.update(false)
    }
}

function detachKey(collection: Collection, entry: EntryPlaceholder) {
    if (collection.dictionary !== null) {
        const cd = collection.dictionary
        g.removeFromArray(entry.node.values.getUnsafe(collection.dictionary.keyPropertyName).changeSubscribers, e => e === cd.duplicatesCheckFunction)
        const keyValue = entry.node.values.getUnsafe(collection.dictionary.keyPropertyName)
        checkDuplicates(collection, keyValue.value.get(), cd.keyPropertyName)
    }
}

export class EntryAddition implements cc.IEntryAddition {
    public readonly collection: Collection
    public readonly entry: EntryPlaceholder
    constructor(collection: Collection, entry: EntryPlaceholder) {
        this.collection = collection
        this.entry = entry
    }
    public apply() {
        //console.log("ATTACHING Entry")
        addEntry(this.collection, this.entry)
        attachKey(this.collection, this.entry)
    }
    public revert() {
        this.collection.entries.removeEntry(this.entry)
        this.entry.entry.errorsAggregator.detach()
        this.entry.entry.subentriesErrorsAggregator.detach()
        detachKey(this.collection, this.entry)
    }
}

export class EntryRemoval implements cc.IEntryRemoval {
    public readonly collection: Collection
    public readonly entry: EntryPlaceholder
    constructor(collection: Collection, entry: EntryPlaceholder) {
        this.collection = collection
        this.entry = entry
    }
    public apply() {
        this.entry.entry.errorsAggregator.detach()
        this.entry.entry.subentriesErrorsAggregator.detach()
        this.entry.status.update(["inactive", { reason: ["deleted"] }])
        detachKey(this.collection, this.entry)
    }
    public revert() {

        this.entry.entry.errorsAggregator.attach(this.collection.errorsAggregator)
        this.entry.entry.subentriesErrorsAggregator.attach(this.collection.errorsAggregator)

        this.entry.status.update(["active"])
        attachKey(this.collection, this.entry)
    }
}