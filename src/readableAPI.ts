
export interface ReadableList {
    forEachEntry(callback: (entry: ReadableListEntry) => void): void
}

export interface ReadableDictionary {
    forEachEntry(callback: (entry: ReadableDictionaryEntry, key: string) => void): void
}

export interface ReadableComponent {
    node: ReadableNode
}

export interface ReadableDictionaryEntry {
    node: ReadableNode
}

export interface ReadableListEntry {
    node: ReadableNode
}

export interface ReadableDataset {
    root: ReadableNode
}

export interface ReadableNode {
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
}

