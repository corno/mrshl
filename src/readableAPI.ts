
export interface ReadableList {
    forEachEntry(callback: (entry: ReadableEntry) => void): void
}

export interface ReadableDictionary {
    forEachEntry(callback: (entry: ReadableEntry, key: string) => void): void
}

export interface ReadableComponent {
    node: ReadableNode
}

export interface ReadableEntry {
    node: ReadableNode
}

export interface ReadableDataset {
    root: ReadableNode
}

export interface ReadableNode {
    getDictionary(name: string): ReadableDictionary
    getList(name: string): ReadableList
    getComponent(name: string): ReadableComponent
    getStateGroup(name: string): ReadableStateGroup
    getValue(name: string): ReadableValue
    forEachProperty(callback: (entry: ReadableProperty, key: string) => void): void
}

export type ReadablePropertyType =
    | ["list", ReadableList]
    | ["dictionary", ReadableDictionary]
    | ["component", ReadableComponent]
    | ["state group", ReadableStateGroup]
    | ["value", ReadableValue]

export interface ReadableProperty {
    readonly isKeyProperty: boolean
    readonly type: ReadablePropertyType
}

export interface ReadableRoot {
    rootNode: ReadableNode
}

export interface ReadableState {
    node: ReadableNode
    getStateKey(): string
}

export interface ReadableStateGroup {
    getCurrentState(): ReadableState
}

export interface ReadableValue {
    readonly isQuoted: boolean
    getValue(): string
    getSuggestions(): string[]
}

