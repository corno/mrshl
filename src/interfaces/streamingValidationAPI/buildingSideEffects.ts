import * as def from "../definitions"
/*
*
*


*
*
*
*/

export type BSECommentType =
    | ["block"]
    | ["line"]

export interface BSEComment {
    value: string
    type:
    | ["block"]
    | ["line"]
}

export interface BSEComments {
    getComments(): BSEComment[]
}

export type BSEPropertyType =
    | ["list", BSEList]
    | ["dictionary", BSEDictionary]
    | ["component", BSEComponent]
    | ["state group", BSEStateGroup]
    | ["value", BSEValue]

export interface BSEProperty {
    readonly isKeyProperty: boolean
    readonly type: BSEPropertyType
}

export interface BSEDictionary {
    readonly comments: BSEComments

    forEachEntry(callback: (entry: BSEEntry, key: string) => void): void
    isEmpty(): boolean
}
export interface BSEList {
    readonly comments: BSEComments
    forEachEntry(callback: (entry: BSEEntry) => void): void
    isEmpty(): boolean
}

export interface BSEComponent {
    readonly node: BSENode
    readonly comments: BSEComments
}

export interface BSEEntry {
    readonly node: BSENode
    readonly comments: BSEComments
}

export interface BSENode {
    getDictionary(name: string): BSEDictionary
    getList(name: string): BSEList
    getComponent(name: string): BSEComponent
    getStateGroup(name: string): BSEStateGroup
    getValue(name: string): BSEValue
    forEachProperty(callback: (entry: BSEProperty, key: string) => void): void
}
export interface BSEStateGroup {
    readonly definition: def.StateGroupDefinition
    readonly comments: BSEComments
    getCurrentState(): BSEState

}

export interface BSEState {
    readonly node: BSENode
    getStateKey(): string
}

export interface BSEValue {
    readonly definition: def.ValueDefinition
    readonly isQuoted: boolean
    readonly comments: BSEComments
    getSuggestions(): string[]
}
