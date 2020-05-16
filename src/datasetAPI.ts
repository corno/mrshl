/* eslint
 "@typescript-eslint/no-empty-interface": off
*/

import * as readable from "./readableAPI"
import * as writable from "./writableAPI"
import * as md from "./metaDataSchema"

export interface Comments {
    setComments(comments: string[]): void
}


export interface Property extends readable.ReadableProperty, writable.WritableProperty {
}

export interface Dictionary extends readable.ReadableDictionary, writable.WritableDictionary {
    createEntry(onError: (message: string) => void): DictionaryEntry
}
export interface List extends readable.ReadableList, writable.WritableList {
    createEntry(onError: (message: string) => void): ListEntry
}

export interface Component extends readable.ReadableComponent, writable.WritableComponent {
    readonly node: Node
    readonly comments: Comments
}

export interface DictionaryEntry extends readable.ReadableEntry, writable.WritableDictionaryEntry {
    readonly node: Node
    readonly comments: Comments
}

export interface ListEntry extends readable.ReadableEntry, writable.WritableListEntry {
    readonly node: Node
    readonly comments: Comments
}

export interface Node extends readable.ReadableNode, writable.WritableNode {
    getDictionary(name: string): Dictionary
    getList(name: string): List
    getComponent(name: string): Component
    getStateGroup(name: string): StateGroup
    getValue(name: string): Value
}

export interface Dataset extends readable.ReadableDataset, writable.WritableDataset {
    readonly schema: md.Schema
    readonly root: Node
}

export interface StateGroup extends readable.ReadableStateGroup, writable.WritableStateGroup {
    setState(stateName: string, onError: (message: string) => void): State
    readonly comments: Comments
}

export interface State {
    readonly node: Node
    readonly comments: Comments
}

export interface Value extends readable.ReadableValue, writable.WritableValue {
    setValue(value: string, onError: (message: string) => void): void
    readonly comments: Comments
    getSuggestions(): string[]
}
