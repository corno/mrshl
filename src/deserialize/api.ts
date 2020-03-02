import { Range, Comment } from "bass-clarinet";

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
    setCollection(name: string, range: Range, comments: Comment[]): CollectionBuilder
    setComponent(name: string): ComponentBuilder
    setStateGroup(name: string, stateName: string, startRange: Range, tuComments: Comment[], optionRange: Range, optionComments: Comment[]): StateBuilder
    setSimpleValue(name: string, value: string, quoted: boolean, range: Range, comments: Comment[]): void
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
    setCollection(name: string, range: Range, comments: Comment[]): CollectionValidator
    setComponent(name: string): ComponentValidator
    setStateGroup(name: string, stateName: string, startRange: Range, tuComments: Comment[], optionRange: Range, optionComments: Comment[]): StateValidator
    setSimpleValue(name: string, value: string, range: Range, comments: Comment[]): void
}

export interface StateValidator {
    node: NodeValidator
}

