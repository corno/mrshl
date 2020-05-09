//tslint:disable: interface-name

import * as md from "./metaDataSchema"

export interface ReadableList {
    readonly definition: md.List
    forEachEntry(callback: (entry: ReadableListEntry) => void): void
}

export interface ReadableDictionary {
    readonly definition: md.Dictionary
    forEachEntry(callback: (entry: ReadableDictionaryEntry, key: string) => void): void
}

export interface ReadableComponent {
    readonly definition: md.Component
    node: ReadableNode
}

export interface ReadableDictionaryEntry {
    readonly definition: md.Dictionary
    node: ReadableNode
}

export interface ReadableListEntry {
    readonly definition: md.List
    node: ReadableNode
}

export interface ReadableDataset {
    schema: md.Schema
    root: ReadableNode
}

export interface ReadableNode {
    readonly definition: md.Node

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
    readonly definition: md.State

    node: ReadableNode
    getStateKey(): string
}

export interface ReadableStateGroup {
    readonly definition: md.StateGroup

    getCurrentState(): ReadableState
}

export interface ReadableValue {
    readonly definition: md.Value
    getValue(): string
}

