// tslint:disable: interface-name
import { InternalSchemaSpecification } from "astn"
import * as g from "./generic"

export interface IFocussable {
    setFocus(): void
}

export interface Collection {
    readonly entries: g.ISubscribableArray
    addEntry(): void
    copyEntriesToHere(forEach: (callback: (entry: Entry) => void) => void): void
}

export interface Command {
    execute(): void
}

export interface Component {
    readonly node: Node
}

export interface Dataset {
    readonly errorManager: ErrorManager
    readonly errorAmount: g.ISubscribableValue<number>
    //readonly commands: g.IDictionary<Command>
    readonly hasUndoActions: g.ISubscribableValue<boolean>
    readonly hasRedoActions: g.ISubscribableValue<boolean>
    readonly hasUnserializedChanges: g.ISubscribableValue<boolean>
    readonly rootNode: Node
    serialize(
        internalSchemaSpecification: InternalSchemaSpecification,
        callback: (data: string) => void,
    ): void
    purgeChanges(): void
    redo(): void
    undo(): void
}

export interface Entry {
    readonly node: Node
    readonly hasSubEntryErrors: g.ISubscribableValue<boolean>
    readonly tempSubEntryErrorsCount: g.ISubscribableValue<number>
    readonly isAdded: g.ISubscribableValue<boolean>
    readonly status: g.ISubscribableValue<EntryStatus>
    delete(): void
}

export interface ErrorManager {
    readonly validationErrors: g.ISubscribableArray
}

export type EntryStatus =
    | ["active"]
    | ["inactive", {
        readonly reason:
        | ["deleted"]
        | ["moved"]
    }]

export type PotentialError = {
    readonly isInErrorState: g.ISubscribableValue<boolean>
}

export interface Property {
    type: PropertyType
}

export type PropertyType =
    | ["collection", Collection]
    | ["component", Component]
    | ["state group", StateGroup]
    | ["value", Value]

export interface Node {
    getCollection(name: string): Collection
    getComponent(name: string): Component
    getTaggedUnion(name: string): StateGroup
    getValue(name: string): Value
    forEachProperty(callback: (property: Property, key: string) => void): void
}

export interface State {
    readonly node: Node
    readonly isCurrentState: g.ISubscribableValue<boolean>
    readonly key: string
}

export interface StateGroup {
    readonly statesOverTime: g.ISubscribableArray
    readonly changeStatus: g.ISubscribableValue<StateGroupChangeStatus>
    readonly createdInNewContext: g.ISubscribableValue<boolean>
    readonly currentStateKey: g.ISubscribableValue<string>
    setMainFocussableRepresentation(focussable: IFocussable): void
    updateState(stateName: string): void
}

export type StateGroupChangeStatus =
    | ["not changed"]
    | ["changed", {
        readonly originalStateName: string
    }]

export interface ValidationError {
    readonly focussable: g.ISubscribableValue<g.IMaybe<IFocussable>>
}

export interface Value {
    readonly value: g.ISubscribableValue<string>
    readonly isDuplicate: PotentialError
    readonly valueIsInvalid: PotentialError
    readonly createdInNewContext: g.ISubscribableValue<boolean>
    readonly changeStatus: g.ISubscribableValue<ValueChangeStatus>

    updateValue(v: string): void
    setMainFocussableRepresentation(f: IFocussable): void
}

export type ValueChangeStatus =
    | ["not changed"]
    | ["changed", {
        readonly originalValue: string
    }]