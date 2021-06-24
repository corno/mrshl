/* eslint
 "@typescript-eslint/no-empty-interface": off
*/

import * as t from "../typedParserDefinitions"

export type CommentType =
    | ["block"]
    | ["line"]

export interface Comment {
    value: string
    type:
    | ["block"]
    | ["line"]
}

export interface Comments {
    addComment(comment: string, type: CommentType): void
}

export type PropertyType =
    | ["list", List]
    | ["dictionary", Dictionary]
    | ["component", Component]
    | ["state group", TaggedUnion]
    | ["value", Value]

export interface Property {
    //readonly isKeyProperty: boolean
    readonly type: PropertyType
}

export interface Dictionary {
    readonly comments: Comments

    //forEachEntry(callback: (entry: Entry, key: string) => void): void
    createEntry(): Entry
    //isEmpty(): boolean
}
export interface List {
    readonly comments: Comments
    //forEachEntry(callback: (entry: Entry) => void): void
    createEntry(): Entry
    //isEmpty(): boolean
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
    getTaggedUnion(name: string): TaggedUnion
    getValue(name: string): Value
    //forEachProperty(callback: (entry: Property, key: string) => void): void
}
export interface TaggedUnion {
    readonly definition: t.TaggedUnionDefinition
    setState(stateName: string, onError: (message: string) => void): Option
    readonly comments: Comments
    //getCurrentState(): Option

}

export interface Option {
    readonly node: Node
    //getStateKey(): string
}

export interface Value {
    readonly definition: t.StringValueDefinition
    //readonly isQuoted: boolean
    setValue(value: string, onError: (message: string) => void): void
    readonly comments: Comments
    getSuggestions(): string[]
}

export interface Root {
    readonly node: Node
}