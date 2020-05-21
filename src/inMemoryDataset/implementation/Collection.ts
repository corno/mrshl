/* eslint
    "max-classes-per-file": off,
*/

import * as g from "../../generics"
import * as bi from "../../asyncAPI"
import * as d from "../../definition"
import * as cc from "./ChangeController"
import { FlexibleErrorsAggregator, IParentErrorsAggregator } from "./ErrorManager"
import { Global } from "./Global"
import { Node } from "./Node"
import { Comments } from "./Comments"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export class Entry {
    public readonly errorsAggregator = new FlexibleErrorsAggregator()
    public readonly subentriesErrorsAggregator = new FlexibleErrorsAggregator()
    public readonly node: Node
    public readonly comments = new Comments()
    constructor(
        nodeDefinition: d.Node,
        global: Global,
        keyProperty: d.Property | null
    ) {
        this.node = new Node(
            nodeDefinition,
            global,
            this.errorsAggregator,
            this.subentriesErrorsAggregator,
            true,
            keyProperty
        )
    }
    // public attachErrors(collection: Collection) {
    //     this.errorsAggregator.attach(collection.errorsAggregator)
    //     this.subentriesErrorsAggregator.attach(collection.errorsAggregator)
    // }
    public detachErrors() {
        this.errorsAggregator.detach()
        this.subentriesErrorsAggregator.detach()
    }
}

export class EntryPlaceholder {
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
        const matches = this.entries.mapToRawArray(e => e).filter(e => {
            //if it is removed, it is never a duplicate
            if (e.status.get()[0] === "inactive") {
                return false
            }
            return e.node.values.getUnsafe(propertyName).getValue() === key
        })
        if (matches.length > 1) {
            matches.forEach(m => {
                m.entry.node.values.getUnsafe(propertyName).isDuplicateImp.update(true)
            })
        }
        if (matches.length === 1) {
            matches[0].entry.node.values.getUnsafe(propertyName).isDuplicateImp.update(false)
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
}

export class List {
    public readonly collection: Collection
    public readonly definition: d.List
    constructor(definition: d.List, collection: Collection) {
        this.collection = collection
        this.definition = definition
    }
}

export class Collection {
    public readonly errorsAggregator: IParentErrorsAggregator
    public readonly global: Global
    public readonly entries = new g.ReactiveArray<EntryPlaceholder>()
    public readonly definition: d.Collection
    public readonly nodeDefinition: d.Node
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
        this.nodeDefinition = ((): d.Node => {
            switch (definition.type[0]) {
                case "dictionary": {
                    const $ = definition.type[1]
                    return $.node
                }
                case "list": {
                    const $ = definition.type[1]
                    return $.node
                }
                default:
                    return assertUnreachable(definition.type[0])
            }
        })()
    }
    public createEntry() {
        throw new Error("IMPLEMENT PROPERLY")
        return new Entry(
            this.nodeDefinition,
            this.global,
            this.keyProperty
        )
    }
    public addEntry(): void {
        const entry = new Entry(
            this.nodeDefinition,
            this.global,
            this.keyProperty,
        )

        this.global.changeController.addEntry(new EntryAddition(
            this,
            new EntryPlaceholder(entry, this, this.global, true)
        ))
    }
    public insert(e: EntryPlaceholder): void {
        e.entry.errorsAggregator.attach(e.parent.errorsAggregator)
        e.entry.subentriesErrorsAggregator.attach(e.parent.errorsAggregator)
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
}
