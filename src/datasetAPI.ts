import * as readable from "./readableAPI";
import * as md from "./metaDataSchema";

// tslint:disable: interface-name

export interface Dictionary extends readable.ReadableDictionary {
    createEntry(onError: (message: string) => void): DictionaryEntry
}
export interface ListBuilder extends readable.ReadableList {
    createEntry(onError: (message: string) => void): ListEntry
}

export interface Component extends readable.ReadableComponent {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface DictionaryEntry extends readable.ReadableEntry {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface ListEntry extends readable.ReadableEntry {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface NodeBuilder extends readable.ReadableNode {
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
    setState(stateName: string, onError: (message: string) => void): StateBuilder
    setComments(comments: string[]): void
}

export interface StateBuilder {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface Value extends readable.ReadableValue {
    definition: md.Value
    setValue(value: string, onError: (message: string) => void): void
    setComments(comments: string[]): void
    getSuggestions(): string[]
}
