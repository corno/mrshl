//tslint:disable: interface-name
export interface SerializableList {
    forEachEntry(callback: (entry: SerializableEntry) => void): void
}

export interface SerializableDictionary {
    forEachEntry(callback: (entry: SerializableEntry, key: string) => void): void
}

export interface SerializableComponent {
    node: SerializableNode
}

export interface SerializableEntry {
    node: SerializableNode
}

export interface SerializableDataset {
    root: SerializableNode
}

export interface SerializableNode {
    getList(name: string): SerializableList
    getDictionary(name: string): SerializableDictionary
    getComponent(name: string): SerializableComponent
    getStateGroup(name: string): SerializableStateGroup
    getValue(name: string): SerializableValue
}

export interface SerializableRoot {
    rootNode: SerializableNode
}

export interface SerializableState {
    node: SerializableNode
    getStateKey(): string
}

export interface SerializableStateGroup {
    getCurrentState(): SerializableState
}

export interface SerializableValue {
    getValue(): string
}

