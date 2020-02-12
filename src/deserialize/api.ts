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
    setStateGroup(name: string, stateName: string): StateBuilder
    setString(name: string, value: string): void
    setNumber(name: string, value: number): void
    setBoolean(name: string, value: boolean): void
}

export interface StateBuilder {
    node: NodeBuilder
}

