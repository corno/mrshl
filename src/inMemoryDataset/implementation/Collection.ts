/* eslint
    "max-classes-per-file": off,
*/

import * as g from "../../generics"
import * as d from "../../definition"
import { FlexibleErrorsAggregator, IParentErrorsAggregator, ErrorManager } from "./ErrorManager"
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
        errorManager: ErrorManager,
        keyProperty: d.Property | null
    ) {
        this.node = new Node(
            nodeDefinition,
            errorManager,
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

export type EntryStatus =
    | ["active"]
    | ["inactive", {
        readonly reason:
        | ["deleted"]
        | ["moved"]
    }]

export class EntryPlaceholder {
    public readonly status = new g.ReactiveValue<EntryStatus>(["active"])
    public readonly isPurged = new g.ReactiveValue<boolean>(false)
    public readonly isAdded: g.ReactiveValue<boolean>
    public readonly entry: Entry
    public readonly node: Node
    public readonly parent: Collection
    public readonly hasSubEntryErrors: g.ISubscribableValue<boolean>
    public readonly tempSubEntryErrorsCount: g.ReactiveValue<number>
    constructor(
        entry: Entry,
        parent: Collection,
        isAdded: boolean
    ) {
        this.entry = entry
        this.node = entry.node
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
    public purge() {
        this.isPurged.update(true)
    }
}

class DictionaryMixin {
    private readonly entries: g.ReactiveArray<EntryPlaceholder>
    private readonly keySubscriber: (oldValue: string, newValue: string) => void
    private readonly keyPropertyName: string
    constructor(entries: g.ReactiveArray<EntryPlaceholder>, keyPropertyName: string) {
        this.keySubscriber = (oldValue: string, newValue: string) => {
            this.checkDuplicates(oldValue)
            this.checkDuplicates(newValue)
        }
        this.entries = entries
        this.keyPropertyName = keyPropertyName
    }
    public attachKey(entry: EntryPlaceholder) {
        const keyValue = entry.node.values.getUnsafe(this.keyPropertyName)
        this.checkDuplicates(keyValue.getValue())
        keyValue.changeSubscribers.push(this.keySubscriber)
    }
    public detachKey(entry: EntryPlaceholder) {
        g.removeFromArray(entry.node.values.getUnsafe(this.keyPropertyName).changeSubscribers, e => e === this.keySubscriber)
        const keyValue = entry.node.values.getUnsafe(this.keyPropertyName)
        this.checkDuplicates(keyValue.getValue())
    }
    private checkDuplicates(key: string) {
        const propertyName = this.keyPropertyName
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

export class Collection {
    public readonly errorsAggregator: IParentErrorsAggregator
    public readonly entries = new g.ReactiveArray<EntryPlaceholder>()
    public readonly nodeDefinition: d.Node
    private readonly dictionary: DictionaryMixin | null
    public readonly keyProperty: d.Property | null
    constructor(
        definition: d.Collection,
        errorsAggregator: IParentErrorsAggregator,
    ) {
        this.errorsAggregator = errorsAggregator
        if (definition.type[0] === "dictionary") {
            this.dictionary = new DictionaryMixin(
                this.entries,
                definition.type[1]["key property"].name,
            )
            this.keyProperty = definition.type[1]["key property"].get()
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
