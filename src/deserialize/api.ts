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
    setSimpleValue(name: string, value: string, quoted: boolean, range: Range, preData: PreData): void
}

export interface StateBuilder {
    node: NodeBuilder
}


export interface CollectionValidator {
    createEntry(): EntryValidator
}

export interface ComponentValidator {
    node: NodeValidator
}

export interface EntryValidator {
    node: NodeValidator
    insert(): void
}

export interface NodeValidator {
    setCollection(name: string): CollectionValidator
    setComponent(name: string): ComponentValidator
    setStateGroup(name: string, stateName: string, startRange: Range, tuPreData: PreData, optionRange: Range, optionPreData: PreData): StateValidator
    setSimpleValue(name: string, value: string, quoted: boolean, range: Range, preData: PreData): void
}

export interface StateValidator {
    node: NodeValidator
}

