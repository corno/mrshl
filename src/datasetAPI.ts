import * as serializable from "./serialize";
import { Schema } from "./metaDataSchema";

// tslint:disable: interface-name

export interface Dictionary extends serializable.SerializableDictionary {
    createEntry(onError: (message: string) => void): DictionaryEntry
}
export interface ListBuilder extends serializable.SerializableList {
    createEntry(onError: (message: string) => void): ListEntry
}

export interface Component extends serializable.SerializableComponent {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface DictionaryEntry extends serializable.SerializableEntry {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface ListEntry extends serializable.SerializableEntry {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface NodeBuilder extends serializable.SerializableNode {
    getDictionary(name: string): Dictionary
    getList(name: string): ListBuilder
    getComponent(name: string): Component
    getStateGroup(name: string): StateGroup
    getValue(name: string): Value
}

export interface Dataset extends serializable.SerializableDataset {
    schema: Schema
    root: NodeBuilder
}

export interface StateGroup extends serializable.SerializableStateGroup {
    setState(stateName: string, onError: (message: string) => void): StateBuilder
    setComments(comments: string[]): void
}

export interface StateBuilder {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface Value extends serializable.SerializableValue {
    setValue(value: string, onError: (message: string) => void): void
    setComments(comments: string[]): void
    getSuggestions(): string[]
}
