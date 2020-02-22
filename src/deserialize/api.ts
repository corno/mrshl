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
    setString(name: string, value: string, range: Range, comments: Comment[]): void
    setNumber(name: string, value: number, range: Range, comments: Comment[]): void
    setBoolean(name: string, value: boolean, range: Range, comments: Comment[]): void
}

export interface StateBuilder {
    node: NodeBuilder
}

