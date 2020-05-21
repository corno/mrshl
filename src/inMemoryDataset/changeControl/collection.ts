import * as cc from "../changeControl/ChangeController"
import { Collection, EntryPlaceholder } from "../implementation"

export class EntryAddition implements cc.IEntryAddition {
    public readonly collection: Collection
    public readonly entry: EntryPlaceholder
    constructor(collection: Collection, entry: EntryPlaceholder) {
        this.collection = collection
        this.entry = entry
    }
    public apply() {
        //console.log("ATTACHING Entry")
        this.collection.insert(this.entry)
        this.collection.attachKey(this.entry)
    }
    public revert() {
        this.collection.remove(this.entry)
        this.collection.detachKey(this.entry)
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
        this.entry.entry.detachErrors()

        this.entry.status.update(["inactive", { reason: ["deleted"] }])
        this.collection.detachKey(this.entry)
    }
    public revert() {

        this.entry.entry.errorsAggregator.attach(this.collection.errorsAggregator)
        this.entry.entry.subentriesErrorsAggregator.attach(this.collection.errorsAggregator)

        this.entry.status.update(["active"])
        this.collection.attachKey(this.entry)
    }
}