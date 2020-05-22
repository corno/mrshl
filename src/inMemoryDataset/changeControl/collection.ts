import * as cc from "../changeControl/ChangeController"
import { Collection, EntryPlaceholder } from "../implementation"

function attachKey(collection: Collection, entry: EntryPlaceholder) {
    if (collection.dictionary !== null) {

        const keyValue = entry.node.values.getUnsafe(collection.dictionary.keyPropertyName)
        collection.dictionary.checkDuplicates(keyValue.value.get())
        keyValue.changeSubscribers.push(collection.dictionary.keySubscriber)
    }
}
function detachKey(collection: Collection, entry: EntryPlaceholder) {
    if (collection.dictionary !== null) {
        collection.dictionary.detachKey(entry)
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
        this.entry.entry.errorsAggregator.attach(this.entry.parent.errorsAggregator)
        this.entry.entry.subentriesErrorsAggregator.attach(this.entry.parent.errorsAggregator)
        this.collection.entries.addEntry(this.entry)
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