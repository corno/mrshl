/* eslint
 "@typescript-eslint/no-empty-interface": off
*/

import * as readable from "./readableAPI";
import * as md from "./metaDataSchema";

export interface Property extends readable.ReadableProperty {
}

export interface Dictionary extends readable.ReadableDictionary {
    readonly definition: md.Dictionary
    createEntry(onError: (message: string) => void): DictionaryEntry
}
export interface List extends readable.ReadableList {
    readonly definition: md.List
    createEntry(onError: (message: string) => void): ListEntry
}

export interface Component extends readable.ReadableComponent {
    readonly definition: md.Component
    node: Node
    setComments(comments: string[]): void
}

export interface DictionaryEntry extends readable.ReadableDictionaryEntry {
    readonly definition: md.Dictionary
    node: Node
    setComments(comments: string[]): void
}

export interface ListEntry extends readable.ReadableListEntry {
    readonly definition: md.List
    node: Node
    setComments(comments: string[]): void
}

export interface Node extends readable.ReadableNode {
    readonly definition: md.Node
    getDictionary(name: string): Dictionary
    getList(name: string): List
    getComponent(name: string): Component
    getStateGroup(name: string): StateGroup
    getValue(name: string): Value
}

export interface Dataset extends readable.ReadableDataset {
    schema: md.Schema
    root: Node
}

export interface StateGroup extends readable.ReadableStateGroup {
    readonly definition: md.StateGroup
    setState(stateName: string, onError: (message: string) => void): State
    setComments(comments: string[]): void
}

export interface State {
    readonly definition: md.State
    node: Node
    setComments(comments: string[]): void
}

export interface Value extends readable.ReadableValue {
    readonly definition: md.Value
    setValue(value: string, onError: (message: string) => void): void
    setComments(comments: string[]): void
    getSuggestions(): string[]
}
