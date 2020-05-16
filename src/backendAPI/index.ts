// tslint:disable: interface-name
import * as g from "../generics/index"

export interface IFocussable {
    setFocus(): void
}

export interface Collection {
    readonly entries: g.ISubscribableArray<Entry>
    addEntry(): void
    copyEntriesToHere(forEach: (callback: (entry: Entry) => void) => void): void
}

export type EntryStatus =
    | ["active"]
    | ["inactive", {
        readonly reason:
        | ["deleted"]
        | ["moved"]
    }]

export interface Entry {
    readonly node: Node
    readonly hasSubEntryErrors: g.ISubscribableValue<boolean>
    readonly tempSubEntryErrorsCount: g.ISubscribableValue<number>
    readonly isAdded: g.ISubscribableValue<boolean>
    readonly status: g.ISubscribableValue<EntryStatus>
    delete(): void
}

export interface Node {
    getCollection(name: string): Collection
    getComponent(name: string): Component
    getStateGroup(name: string): StateGroup
    getValue(name: string): Value
}


export type ValueChangeStatus =
    | ["not changed"]
    | ["changed", {
        readonly originalValue: string
    }]

export interface PotentialError {
    readonly isInErrorState: g.ISubscribableValue<boolean>
}

export interface Value {
    readonly value: g.ISubscribableValue<string>
    readonly isDuplicate: PotentialError
    readonly isInvalidNumber: PotentialError
    readonly createdInNewContext: g.ISubscribableValue<boolean>
    readonly changeStatus: g.ISubscribableValue<ValueChangeStatus>

    updateValue(v: string): void
    setMainFocussableRepresentation(f: IFocussable): void
}

export interface Component {
    readonly node: Node
}

export interface State {
    readonly node: Node
    readonly isCurrentState: g.ISubscribableValue<boolean>
    readonly key: string
}
export type StateGroupChangeStatus =
    | ["not changed"]
    | ["changed", {
        readonly originalStateName: string
    }]

export interface StateGroup {
    readonly statesOverTime: g.ISubscribableArray<State>
    readonly changeStatus: g.ISubscribableValue<StateGroupChangeStatus>
    readonly createdInNewContext: g.ISubscribableValue<boolean>
    readonly currentStateKey: g.ISubscribableValue<string>
    setMainFocussableRepresentation(focussable: IFocussable): void
    updateState(stateName: string): void
}


export interface Command {
    execute(): void
}
export interface ValidationError {
    readonly focussable: g.ISubscribableValue<g.Maybe<IFocussable>>
}

export interface ErrorManager {
    readonly validationErrors: g.ISubscribableArray<ValidationError>
}

export interface Root {
    readonly errorManager: ErrorManager
    readonly errorAmount: g.ISubscribableValue<number>
    readonly commands: g.Dictionary<Command>
    readonly hasUndoActions: g.ISubscribableValue<boolean>
    readonly hasRedoActions: g.ISubscribableValue<boolean>
    readonly hasUnserializedChanges: g.ISubscribableValue<boolean>
    readonly rootNode: Node
    serialize(callback: (data: string) => void): void
    purgeChanges(): void
    redo(): void
    undo(): void
}