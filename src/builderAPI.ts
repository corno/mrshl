import * as bc from "bass-clarinet"

// tslint:disable: interface-name

export interface DictionaryBuilder {
    createEntry(onError: (message: string) => void): DictionaryEntryBuilder
}
export interface ListBuilder {
    createEntry(onError: (message: string) => void): ListEntryBuilder
}

export interface ComponentBuilder {
    node: NodeBuilder
}

export interface DictionaryEntryBuilder {
    node: NodeBuilder
}

export interface ListEntryBuilder {
    node: NodeBuilder
}

export interface NodeBuilder {
    getDictionary(name: string): DictionaryBuilder
    getList(name: string): ListBuilder
    getComponent(name: string): ComponentBuilder
    getStateGroup(name: string): StateGroupBuilder
    getValue(name: string): ValueBuilder
}

export interface StateGroupBuilder {
    setState(stateName: string, onError: (message: string) => void): StateBuilder
    setComments(comments: bc.Comment[]): void
}

export interface StateBuilder {
    node: NodeBuilder
    setComments(comments: bc.Comment[]): void
}

export interface ValueBuilder {
    setValue(value: string, onError: (message: string) => void): void
    setComments(comments: bc.Comment[]): void
    getSuggestions(): string[]
}
