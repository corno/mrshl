import * as readable from "./readableAPI";
import * as md from "./metaDataSchema";

// tslint:disable: interface-name

export interface Dictionary extends readable.ReadableDictionary {
    readonly definition: md.Dictionary
    createEntry(onError: (message: string) => void): DictionaryEntry
}
export interface ListBuilder extends readable.ReadableList {
    readonly definition: md.List
    createEntry(onError: (message: string) => void): ListEntry
}

export interface Component extends readable.ReadableComponent {
    readonly definition: md.Component
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface DictionaryEntry extends readable.ReadableDictionaryEntry {
    readonly definition: md.Dictionary
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface ListEntry extends readable.ReadableListEntry {
    readonly definition: md.List
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface NodeBuilder extends readable.ReadableNode {
    readonly definition: md.Node
    getDictionary(name: string): Dictionary
    getList(name: string): ListBuilder
    getComponent(name: string): Component
    getStateGroup(name: string): StateGroup
    getValue(name: string): Value
}

export interface Dataset extends readable.ReadableDataset {
    schema: md.Schema
    root: NodeBuilder
}

export interface StateGroup extends readable.ReadableStateGroup {
    readonly definition: md.StateGroup
    setState(stateName: string, onError: (message: string) => void): StateBuilder
    setComments(comments: string[]): void
}

export interface StateBuilder {
    readonly definition: md.State
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface Value extends readable.ReadableValue {
    readonly definition: md.Value
    setValue(value: string, onError: (message: string) => void): void
    setComments(comments: string[]): void
    getSuggestions(): string[]
}
