/* eslint
    "max-classes-per-file": off,
*/

import * as g from "../genericimp"
import * as astncore from "astn-core"
import { FlexibleErrorsAggregator, IParentErrorsAggregator, ErrorManager } from "./ErrorManager"
import { Node } from "./Node"
import { Comments } from "./Comments"
import { initializeNode } from "../initializeNode"
import { ISubscribableValue } from "../../../../interfaces/asyncAPI/generic"
import { Global } from "../Global"
import { Value } from "./Value"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export class Entry {
    public readonly errorsAggregator = new FlexibleErrorsAggregator()
    public readonly subentriesErrorsAggregator = new FlexibleErrorsAggregator()
    public readonly node: Node
    public readonly comments = new Comments()
    public readonly key: Value | null
    constructor(
        nodeDefinition: astncore.NodeDefinition,
        errorManager: ErrorManager,
        dictionary: Dictionary | null
    ) {
        this.key = dictionary === null ? null : new Value(
            dictionary.keyDefinition,
            this.errorsAggregator,
            true,
            errorManager,
        )
        this.node = new Node(
            node => {
                initializeNode(
                    node,
                    nodeDefinition,
                    errorManager,
                    this.errorsAggregator,
                    this.subentriesErrorsAggregator,
                    true,
                )
            }
        )
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
    public readonly hasSubEntryErrors: ISubscribableValue<boolean>
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
}

export class Dictionary {
    public readonly duplicatesCheckFunction: (oldValue: string, newValue: string) => void
    public readonly keyDefinition: astncore.SimpleStringDefinition
    /**
     *
     * @param keyPropertyName
     * @param keyProperty
     * @param duplicatesCheckFunction a function that can be used to subscribe to the keys of the entries to check for duplicates
     */
    constructor(
        keyDefinition: astncore.SimpleStringDefinition,
        duplicatesCheckFunction: (oldValue: string, newValue: string) => void,
    ) {
        this.duplicatesCheckFunction = duplicatesCheckFunction
        this.keyDefinition = keyDefinition
    }
}

export class Collection {
    public readonly errorsAggregator: IParentErrorsAggregator
    public readonly entries = new g.ReactiveArray<EntryPlaceholder>()
    public readonly nodeDefinition: astncore.NodeDefinition
    public readonly dictionary: Dictionary | null
    public readonly comments = new Comments()
    constructor(
        definition: {
            type:
            | ["list", astncore.ListDefinition]
            | ["dictionary", astncore.DictionaryDefinition]
        },
        errorsAggregator: IParentErrorsAggregator,
        dictionary: Dictionary | null,
    ) {
        this.errorsAggregator = errorsAggregator
        this.dictionary = dictionary
        this.nodeDefinition = ((): astncore.NodeDefinition => {
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
}

export function addEntry(collection: Collection, entryPlaceholder: EntryPlaceholder): void {
    entryPlaceholder.entry.errorsAggregator.attach(entryPlaceholder.parent.errorsAggregator)
    entryPlaceholder.entry.subentriesErrorsAggregator.attach(entryPlaceholder.parent.errorsAggregator)
    collection.entries.addEntry(entryPlaceholder)
}

export function createEntry(
    nodeDefinition: astncore.NodeDefinition,
    collection: Collection,
    global: Global,
): Entry {
    const entryImp = new Entry(
        nodeDefinition,
        global.errorManager,
        collection.dictionary,
    )
    const entryPlaceHolder = new EntryPlaceholder(entryImp, collection, true)
    addEntry(collection, entryPlaceHolder)
    return entryImp
}