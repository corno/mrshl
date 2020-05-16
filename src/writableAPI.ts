/* eslint
 "@typescript-eslint/no-empty-interface": off
*/

export interface Comments {
    setComments(comments: string[]): void
}

export interface WritableProperty {
}

export interface WritableDictionary {
    createEntry(onError: (message: string) => void): WritableDictionaryEntry
}
export interface WritableList {
    createEntry(onError: (message: string) => void): WritableListEntry
}

export interface WritableComponent {
    readonly node: WritableNode
    readonly comments: Comments
}

export interface WritableDictionaryEntry {
    readonly node: WritableNode
    readonly comments: Comments
}

export interface WritableListEntry {
    readonly node: WritableNode
    readonly comments: Comments
}

export interface WritableNode {
    getDictionary(name: string): WritableDictionary
    getList(name: string): WritableList
    getComponent(name: string): WritableComponent
    getStateGroup(name: string): WritableStateGroup
    getValue(name: string): WritableValue
}

export interface WritableDataset {
    readonly root: WritableNode
}

export interface WritableStateGroup {
    setState(stateName: string, onError: (message: string) => void): WritableState
    readonly comments: Comments
}

export interface WritableState {
    readonly node: WritableNode
    readonly comments: Comments
}

export interface WritableValue {
    setValue(value: string, onError: (message: string) => void): void
    readonly comments: Comments
    getSuggestions(): string[]
}
