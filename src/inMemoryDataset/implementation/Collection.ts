/* eslint
    "max-classes-per-file": off,
*/

import * as g from "../../generics/index"
import * as bi from "../../asynAPI"
import * as d from "../../definition/index"
import * as cc from "./ChangeController"
import { copyEntry, EntryBuilder } from "../copyEntry"
import { FlexibleErrorsAggregator, IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { defaultInitializeNode, Node } from "./Node"
import { Comments } from "./Comments"

export class Entry {
    public readonly errorsAggregator = new FlexibleErrorsAggregator()
    public readonly subentriesErrorsAggregator = new FlexibleErrorsAggregator()
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(nodeDefinition: d.Node, keyProperty: d.Property | null) {
        this.node = new Node(nodeDefinition, keyProperty)
    }
    public purgeChanges() {
        this.node.purgeChanges()
    }
    public attachErrors(collection: Collection) {
        this.errorsAggregator.attach(collection.errorsAggregator)
        this.subentriesErrorsAggregator.attach(collection.errorsAggregator)
    }
    public detachErrors() {
        this.errorsAggregator.detach()
        this.subentriesErrorsAggregator.detach()
    }
}

export class EntryPlaceholder implements bi.Entry {
    public readonly status = new g.ReactiveValue<bi.EntryStatus>(["active"])
    public readonly isPurged = new g.ReactiveValue<boolean>(false)
    public readonly isAdded: g.ReactiveValue<boolean>
    public readonly entry: Entry
    public readonly node: Node
    public readonly parent: Collection
    public readonly global: Global
    public readonly hasSubEntryErrors: g.ISubscribableValue<boolean>
    public readonly tempSubEntryErrorsCount: g.ReactiveValue<number>
    constructor(
        entry: Entry,
        parent: Collection,
        global: Global,
        isAdded: boolean
    ) {
        this.entry = entry
        this.node = entry.node
        this.global = global
        this.parent = parent
        this.isAdded = new g.ReactiveValue(isAdded)
        this.hasSubEntryErrors = new g.DerivedReactiveValue(entry.subentriesErrorsAggregator.errorCount, ec => ec > 0)
        this.tempSubEntryErrorsCount = this.entry.subentriesErrorsAggregator.errorCount

        //     this.dictionaryData = {
        //         currentKeyValue: key.getValue(),
        //         keyProperty: key,
        //     }
        //     key.value.su bscribeToValue(newKey => {
        //         //new value
        //         if (this.status.get()[0] === "active") {
        //             this.parent.checkDuplicates(newKey, $["key property"])
        //         }
        //         if (this.dictionaryData === null) {
        //             throw new Error("missing dictionary data")
        //         }
        //         //old value
        //         if (this.status.get()[0] === "active") {
        //             this.parent.checkDuplicates(this.dictionaryData.currentKey, $["key property"])
        //             this.dictionaryData.currentKey = newKey
        //         }
        //     })
    }
    public delete() {
        if (this.status.get()[0] === "inactive") {
            console.error("trying to delete a already inactive entry")
            return
        }
        this.global.changeController.deleteEntry(new EntryRemoval(this.parent, this))
    }
    public purge() {
        this.isPurged.update(true)
    }
}

class EntryAddition implements cc.IEntryAddition {
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

class EntryRemoval implements cc.IEntryRemoval {
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
        this.entry.entry.attachErrors(this.collection)

        this.entry.status.update(["active"])
        this.collection.attachKey(this.entry)
    }
}

class DictionaryMixin {
    public readonly definition: d.Dictionary
    private readonly entries: g.ReactiveArray<EntryPlaceholder>
    private readonly keySubscriber: (oldValue: string, newValue: string) => void
    constructor(definition: d.Dictionary, entries: g.ReactiveArray<EntryPlaceholder>) {
        this.definition = definition
        this.keySubscriber = (oldValue: string, newValue: string) => {
            this.checkDuplicates(oldValue)
            this.checkDuplicates(newValue)
        }
        this.entries = entries
    }
    public attachKey(entry: EntryPlaceholder) {
        const keyValue = entry.node.values.getUnsafe(this.definition["key property"].name)
        this.checkDuplicates(keyValue.getValue())
        keyValue.changeSubscribers.push(this.keySubscriber)
    }
    public detachKey(entry: EntryPlaceholder) {
        g.removeFromArray(entry.node.values.getUnsafe(this.definition["key property"].name).changeSubscribers, e => e === this.keySubscriber)
        const keyValue = entry.node.values.getUnsafe(this.definition["key property"].name)
        this.checkDuplicates(keyValue.getValue())
    }
    private checkDuplicates(key: string) {
        const propertyName = this.definition["key property"].name
        const matches = this.entries.map(e => e).filter(e => {
            //if it is removed, it is never a duplicate
            if (e.status.get()[0] === "inactive") {
                return false
            }
            return e.node.values.getUnsafe(propertyName).getValue() === key
        })
        if (matches.length > 1) {
            matches.forEach(m => {
                m.entry.node.getValue(propertyName).isDuplicateImp.update(true)
            })
        }
        if (matches.length === 1) {
            matches[0].entry.node.getValue(propertyName).isDuplicateImp.update(false)
        }
    }
}

export class Dictionary {
    public readonly collection: Collection
    public readonly definition: d.Dictionary
    constructor(definition: d.Dictionary, collection: Collection) {
        this.collection = collection
        this.definition = definition
    }
    public createEntry() {
        return this.collection.createEntry()
    }
    public forEachEntry(callback: (entry: Entry, key: string) => void) {
        this.collection.entries.forEach(e => {
            if (e.status.get()[0] !== "inactive") {

                callback(e.entry, e.entry.node.getValue(this.definition["key property"].name).getValue())
            }
        })
    }
}

export class List {
    public readonly collection: Collection
    constructor(collection: Collection) {
        this.collection = collection
    }
    public createEntry() {
        return this.collection.createEntry()
    }
    public forEachEntry(callback: (entry: Entry) => void) {
        this.collection.entries.forEach(e => {
            if (e.status.get()[0] !== "inactive") {
                callback(e.entry)
            }
        })
    }
}

export class Collection implements bi.Collection {
    public readonly errorsAggregator: IParentErrorsAggregator
    public readonly global: Global
    public readonly entries = new g.ReactiveArray<EntryPlaceholder>()
    public readonly definition: d.Collection
    private readonly dictionary: DictionaryMixin | null
    public readonly keyProperty: d.Property | null
    constructor(
        definition: d.Collection,
        errorsAggregator: IParentErrorsAggregator,
        global: Global,
    ) {
        this.definition = definition
        this.errorsAggregator = errorsAggregator
        this.global = global
        if (this.definition.type[0] === "dictionary") {
            this.dictionary = new DictionaryMixin(
                this.definition.type[1],
                this.entries,
            )
            this.keyProperty = this.definition.type[1]["key property"].get()
        } else {
            this.dictionary = null
            this.keyProperty = null
        }
    }
    public createEntry() {
        throw new Error("IMPLEMENT PROPERLY")
        return new Entry(this.definition.node, this.keyProperty)
    }
    public purgeChanges() {
        this.entries.removeEntries(candidate => {
            return candidate.status.get()[0] === "inactive"
        })
        this.entries.forEach(entry => {
            entry.isAdded.update(false)
            entry.entry.purgeChanges()
        })
    }
    public addEntry(): void {
        const entry = new Entry(
            this.definition.node,
            this.keyProperty
        )

        defaultInitializeNode(
            this.definition.node,
            entry.node,
            this.global,
            entry.errorsAggregator,
            entry.subentriesErrorsAggregator,
            true
        )
        this.global.changeController.addEntry(new EntryAddition(
            this,
            new EntryPlaceholder(entry, this, this.global, true)
        ))
    }
    public insert(e: EntryPlaceholder): void {
        e.entry.attachErrors(e.parent)
        this.entries.addEntry(e)
    }
    public attachKey(entry: EntryPlaceholder) {
        if (this.dictionary !== null) {
            this.dictionary.attachKey(entry)
        }
    }
    public detachKey(entry: EntryPlaceholder) {
        if (this.dictionary !== null) {
            this.dictionary.detachKey(entry)
        }
    }
    public remove(e: EntryPlaceholder): void {
        this.entries.removeEntry(e)
        e.entry.detachErrors()
    }
    public copyEntriesToHere(forEach: (callback: (entry: bi.Entry) => void) => void) {
        this.global.changeController.copyEntriesToCollection(callback => {
            forEach(e => {
                if (!(e instanceof EntryPlaceholder)) {
                    console.error(e)
                    throw new Error("Unexpected, entry is not an instance of Entry")
                }
                const entry = new Entry(this.definition.node, this.keyProperty)
                const entryBuilder = new EntryBuilder(this, entry, true, this.keyProperty)
                copyEntry(e.entry, entryBuilder)

                callback(new EntryAddition(
                    this,
                    new EntryPlaceholder(
                        entry,
                        this,
                        this.global,
                        true,
                    )
                ))
            })
        })
    }
}
