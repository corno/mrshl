//tslint:disable: interface-name
export interface SerializableCollection {
    forEachEntry(callback: (entry: SerializableEntry) => void): void
}

export interface SerializableComponent {
    getNode(): SerializableNode
}

export interface SerializableEntry {
    getNode(): SerializableNode
}

export interface SerializableNode {
    getCollection(name: string): SerializableCollection
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

