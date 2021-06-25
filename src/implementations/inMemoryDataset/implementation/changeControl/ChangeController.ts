import { ISubscribableValue } from "../../../../interfaces/asyncAPI/generic"
import * as g from "../genericimp"

export interface IEntryAddition {
    apply(): void
    revert(): void
}
export interface IEntryRemoval {
    apply(): void
    revert(): void
}

export interface IValue {
    getValue(): string
    setValue(newValue: string): void
}

export interface IStateChange {
    apply(): void
    revert(): void
}

export interface IChanges {
    readonly hasChanges: g.ReactiveValue<boolean>
}
export interface IChangeController {
    readonly amountOfChangesSinceLastSerialization: ISubscribableValue<number | null>
    readonly executedChanges: IChanges
    readonly revertedChanges: IChanges
    resetSerializationPosition(): void
    undo(): void
    redo(): void
    purgeChanges(): void
    updateValue(valueProperty: IValue, newValue: string): void
    updateState(stateChange: IStateChange): void
    deleteEntry(entry: IEntryRemoval): void
    addEntry(entry: IEntryAddition): void
    copyEntriesToCollection(forEach: (callback: (entry: IEntryAddition) => void) => void): void
}