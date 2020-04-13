import * as serializable from "./serialize";

// tslint:disable: interface-name

export interface DictionaryBuilder extends serializable.SerializableDictionary {
    createEntry(onError: (message: string) => void): DictionaryEntryBuilder
}
export interface ListBuilder extends serializable.SerializableList {
    createEntry(onError: (message: string) => void): ListEntryBuilder
}

export interface ComponentBuilder extends serializable.SerializableComponent {
    node: NodeBuilder
}

export interface DictionaryEntryBuilder extends serializable.SerializableEntry {
    node: NodeBuilder
}

export interface ListEntryBuilder extends serializable.SerializableEntry {
    node: NodeBuilder
}

export interface NodeBuilder extends serializable.SerializableNode {
    getDictionary(name: string): DictionaryBuilder
    getList(name: string): ListBuilder
    getComponent(name: string): ComponentBuilder
    getStateGroup(name: string): StateGroupBuilder
    getValue(name: string): ValueBuilder
}

export interface StateGroupBuilder extends serializable.SerializableStateGroup {
    setState(stateName: string, onError: (message: string) => void): StateBuilder
    setComments(comments: string[]): void
}

export interface StateBuilder {
    node: NodeBuilder
    setComments(comments: string[]): void
}

export interface ValueBuilder extends serializable.SerializableValue {
    setValue(value: string, onError: (message: string) => void): void
    setComments(comments: string[]): void
    getSuggestions(): string[]
}
