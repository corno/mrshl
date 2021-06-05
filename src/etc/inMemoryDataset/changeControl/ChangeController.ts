import * as g from "../../generic"

function assertUnreachable(_x: never) {
    throw new Error("Unreachable")
}

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

type UpdateState = {
    stateChange: IStateChange
}
type UpdateValue = {
    valueProperty: IValue
    oldValue: string
    newValue: string
}
type DeleteEntry = {
    entry: IEntryRemoval
}
type AddEntry = {
    entry: IEntryAddition
}
type CopyEntries = {
    entries: IEntryAddition[]
}

type ChangeType =
    | ["update state", UpdateState]
    | ["update value", UpdateValue]
    | ["delete entry", DeleteEntry]
    | ["add entry", AddEntry]
    | ["copy entries", CopyEntries]

type Change = {
    type: ChangeType
}

export interface IChanges {
    readonly hasChanges: g.ISubscribableValue<boolean>
}

class Changes implements IChanges {
    public readonly hasChanges = new g.ReactiveValue<boolean>(false)
    private readonly changes: Change[] = []
    public pop(callback: (change: Change) => void) {
        const change = this.changes.pop()
        if (this.changes.length === 0) {
            this.hasChanges.update(false)
        }
        if (change !== undefined) {
            callback(change)
        }
    }
    public empty() {
        this.changes.splice(0, this.changes.length)
        this.hasChanges.update(false)
    }
    public push(change: Change) {
        this.changes.push(change)
        this.hasChanges.update(true)
    }
}

export interface IChangeController {
    readonly amountOfChangesSinceLastSerialization: g.ISubscribableValue<number | null>
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

class ChangeController implements IChangeController {
    public readonly amountOfChangesSinceLastSerialization = new g.ReactiveValue<number | null>(0)
    public readonly executedChanges = new Changes()
    public readonly revertedChanges = new Changes()
    public resetSerializationPosition() {
        this.amountOfChangesSinceLastSerialization.update(0)
    }

    public updateValue(valueProperty: IValue, newValue: string) {
        this.executeChange({
            type: ["update value", {
                valueProperty: valueProperty,
                oldValue: valueProperty.getValue(),
                newValue: newValue,
            }],
        })
    }
    public updateState(stateChange: IStateChange) {
        this.executeChange({
            type: ["update state", {
                stateChange: stateChange,
            }],
        })
    }
    public addEntry(entry: IEntryAddition) {
        this.executeChange({
            type: ["add entry", {
                entry: entry,
            }],
        })
    }
    public deleteEntry(entry: IEntryRemoval) {
        this.executeChange({
            type: ["delete entry", {
                entry: entry,
            }],
        })
    }
    public copyEntriesToCollection(forEach: (callback: (entry: IEntryAddition) => void) => void) {
        const entries: IEntryAddition[] = []
        forEach(entry => {
            entries.push(entry)
        })
        this.executeChange({
            type: ["copy entries", {
                entries: entries,
            }],
        })
    }


    public purgeChanges() {
        this.executedChanges.empty()
        this.revertedChanges.empty()
        const serializeOffset = this.amountOfChangesSinceLastSerialization.get()
        if (serializeOffset !== 0) {
            //there are open changes. They are now deleted and thus we can never go back to the serialized state
            this.amountOfChangesSinceLastSerialization.update(null)
        }
    }
    public undo() {
        this.executedChanges.pop(lastChange => {
            switch (lastChange.type[0]) {
                case "add entry": {
                    const $ = lastChange.type[1]
                    $.entry.revert()
                    break
                }
                case "copy entries": {
                    const $ = lastChange.type[1]
                    $.entries.forEach(e => {
                        e.revert()
                    })
                    break
                }
                case "delete entry": {
                    const $ = lastChange.type[1]
                    $.entry.revert()
                    break
                }
                case "update state": {
                    const $ = lastChange.type[1]
                    $.stateChange.revert()
                    break
                }
                case "update value": {
                    const $ = lastChange.type[1]
                    $.valueProperty.setValue($.oldValue)
                    break
                }
                default:
                    return assertUnreachable(lastChange.type[0])
            }
            this.revertedChanges.push(lastChange)
            const serializeOffset = this.amountOfChangesSinceLastSerialization.get()
            if (serializeOffset !== null) {
                this.amountOfChangesSinceLastSerialization.update(serializeOffset - 1)
            }
        })
    }
    public redo() {
        this.revertedChanges.pop(lastRevertedChange => {
            this.doChange(lastRevertedChange)
            const serializeOffset = this.amountOfChangesSinceLastSerialization.get()
            if (serializeOffset !== null) {
                this.amountOfChangesSinceLastSerialization.update(serializeOffset + 1)
            }
        })
    }
    private executeChange(change: Change) {

        this.doChange(change)
        const serializeOffset = this.amountOfChangesSinceLastSerialization.get()
        if (serializeOffset !== null) {
            if (serializeOffset < 0) {
                //from the serialization point, actions were reverted (undone)
                //and now there is a new change
                //we can never get back to the serialization point
                this.amountOfChangesSinceLastSerialization.update(null)
            } else {
                this.amountOfChangesSinceLastSerialization.update(serializeOffset + 1)
            }
        }
        //if there were reverted changes, they are now superseded by this new change, so drop them
        this.revertedChanges.empty()
    }
    private doChange(change: Change) {
        this.executedChanges.push(change)
        switch (change.type[0]) {
            case "add entry": {
                const $ = change.type[1]
                $.entry.apply()
                break
            }
            case "copy entries": {
                const $ = change.type[1]
                $.entries.forEach(e => {
                    e.apply()
                })
                alert("YEP")
                break
            }
            case "delete entry": {
                const $ = change.type[1]
                $.entry.apply()
                break
            }
            case "update state": {
                const $ = change.type[1]
                $.stateChange.apply()
                break
            }
            case "update value": {
                const $ = change.type[1]
                $.valueProperty.setValue($.newValue)
                break
            }
            default:
                return assertUnreachable(change.type[0])
        }
    }
}

export function createChangeController(): IChangeController {
    return new ChangeController()
}