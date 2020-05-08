//tslint:disable: interface-name

import * as md from "./metaDataSchema"

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
    schema: md.Schema
    root: ReadableNode
}

export interface ReadableNode {
    getList(name: string): ReadableList
    getDictionary(name: string): ReadableDictionary
    getComponent(name: string): ReadableComponent
    getStateGroup(name: string): ReadableStateGroup
    getValue(name: string): ReadableValue
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
    getValue(): string
}

