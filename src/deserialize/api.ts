import { Range, PreData } from "bass-clarinet";

// tslint:disable: interface-name

export interface CollectionBuilder {
    createEntry(): EntryBuilder
}

export interface ComponentBuilder {
    node: NodeBuilder
}

export interface EntryBuilder {
    node: NodeBuilder
    insert(): void
}

export interface NodeBuilder {
    setCollection(name: string): CollectionBuilder
    setComponent(name: string): ComponentBuilder
    setStateGroup(name: string, stateName: string, startRange: Range, tuPreData: PreData, optionRange: Range, optionPreData: PreData): StateBuilder
    setSimpleValue(name: string, value: string, quoted: boolean, range: Range, preData: PreData): ValueBuilder
}

export interface StateBuilder {
    node: NodeBuilder
}

export interface ValueBuilder {
    getSuggestions(): string[]
}
