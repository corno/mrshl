//tslint:disable: interface-name
export interface SerializableList {
    forEachEntry(callback: (entry: SerializableEntry) => void): void
}

export interface SerializableDictionary {
    forEachEntry(callback: (entry: SerializableEntry, key: string) => void): void
}

export interface SerializableComponent {
    getNode(): SerializableNode
}

export interface SerializableEntry {
    getNode(): SerializableNode
}

export interface SerializableNode {
    getList(name: string): SerializableList
    getDictionary(name: string): SerializableDictionary
    getComponent(name: string): SerializableComponent
    getStateGroup(name: string): SerializableStateGroup
    getString(name: string): SerializableString
    getBoolean(name: string): SerializableBoolean
    getNumber(name: string): SerializableNumber
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

export interface SerializableBoolean {
    getValue(): boolean
}

export interface SerializableNumber {
    getValue(): number
}

export interface SerializableString {
    getValue(): string
}

