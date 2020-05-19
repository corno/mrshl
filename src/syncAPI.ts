/* eslint
 "@typescript-eslint/no-empty-interface": off
*/

import * as md from "./metaDataSchema"

export interface Comments {
    setComments(comments: string[]): void
}

export type PropertyType =
    | ["list", List]
    | ["dictionary", Dictionary]
    | ["component", Component]
    | ["state group", StateGroup]
    | ["value", Value]

export interface Property {
    readonly isKeyProperty: boolean
    readonly type: PropertyType
}

export interface Dictionary {
    forEachEntry(callback: (entry: Entry, key: string) => void): void
    createEntry(): Entry
}
export interface List {
    forEachEntry(callback: (entry: Entry) => void): void
    createEntry(): Entry
}

export interface Component {
    readonly node: Node
    readonly comments: Comments
}

export interface Entry {
    readonly node: Node
    readonly comments: Comments
}

export interface Node {
    getDictionary(name: string): Dictionary
    getList(name: string): List
    getComponent(name: string): Component
    getStateGroup(name: string): StateGroup
    getValue(name: string): Value
    forEachProperty(callback: (entry: Property, key: string) => void): void
}

export interface IDataset {
    readonly schema: md.Schema
    readonly root: Node
}

export interface StateGroup {
    setState(stateName: string, onError: (message: string) => void): State
    readonly comments: Comments
    getCurrentState(): State

}

export interface State {
    readonly node: Node
    readonly comments: Comments
    getStateKey(): string
}

export interface Value {
    readonly isQuoted: boolean
    setValue(value: string, onError: (message: string) => void): void
    readonly comments: Comments
    getValue(): string
    getSuggestions(): string[]
}
