/* eslint
    "max-classes-per-file": off
*/

import * as asyncAPI from "../asyncAPI"
import * as imp from "./implementation"
import * as d from "../types"
import * as g from "../generics"
import * as syncAPIImp from "./syncAPIImplementation"
import { copyEntry } from "./copyEntry"
import { purgeNodeChanges } from "./implementation/purgeChanges"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

class Collection implements asyncAPI.Collection {
    public readonly entries: g.ISubscribableArray<asyncAPI.Entry>

    private readonly imp: imp.Collection
    constructor(collectionImp: imp.Collection) {
        this.imp = collectionImp
        this.entries = collectionImp.entries.map(e => {
            return new Entry(e)
        })
    }
    public copyEntriesToHere(forEach: (callback: (entry: asyncAPI.Entry) => void) => void) {
        this.imp.global.changeController.copyEntriesToCollection(callback => {
            forEach(sourceEntryImp => {
                if (!(sourceEntryImp instanceof imp.EntryPlaceholder)) {
                    console.error(sourceEntryImp)
                    throw new Error("Unexpected, entry is not an instance of Entry")
                }
                const newEntry = new imp.Entry(
                    this.imp.nodeDefinition,
                    this.imp.global,
                    this.imp.keyProperty
                )
                const source = new syncAPIImp.Entry(this.imp, sourceEntryImp.entry, true, this.imp.keyProperty)
                const target = new syncAPIImp.Entry(this.imp, newEntry, true, this.imp.keyProperty)
                copyEntry(source, target)

                callback(new imp.EntryAddition(
                    this.imp,
                    new imp.EntryPlaceholder(
                        newEntry,
                        this.imp,
                        this.imp.global,
                        true,
                    )
                ))
            })
        })
    }
    public addEntry(): void {
        const entry = new imp.Entry(
            this.imp.nodeDefinition,
            this.imp.global,
            this.imp.keyProperty,
        )

        this.imp.global.changeController.addEntry(new imp.EntryAddition(
            this.imp,
            new imp.EntryPlaceholder(entry, this.imp, this.imp.global, true)
        ))
    }
}

class Component implements asyncAPI.Component {
    public readonly node: Node
    //private readonly imp: imp.Component
    constructor(componentImp: imp.Component) {
        //this.imp = componentImp
        this.node = new Node(componentImp.node)
    }
}

export class Dataset implements asyncAPI.Dataset {

    public readonly errorAmount: g.ReactiveValue<number>
    public readonly errorManager: imp.ErrorManager

    public readonly commands: g.Dictionary<imp.Command>
    public readonly hasUndoActions: g.ISubscribableValue<boolean>
    public readonly hasRedoActions: g.ISubscribableValue<boolean>
    public readonly hasUnserializedChanges: g.ISubscribableValue<boolean>
    public readonly rootNode: Node

    private readonly imp: imp.RootImp

    //public readonly rootNode: Node
    constructor(rootImp: imp.RootImp) {
        this.imp = rootImp
        this.commands = new g.Dictionary({})
        this.rootNode = new Node(rootImp.rootNode)
        this.hasUndoActions = rootImp.global.changeController.executedChanges.hasChanges
        this.hasRedoActions = rootImp.global.changeController.revertedChanges.hasChanges
        this.errorAmount = rootImp.errorsAggregator.errorCount
        this.errorManager = rootImp.global.errorManager

        this.hasUnserializedChanges = new g.DerivedReactiveValue(rootImp.global.changeController.amountOfChangesSinceLastSerialization, position => {
            if (position === null) {
                return true
            } else {
                return position !== 0
            }
        })
    }
    public serialize(_callback: (data: string) => void) {
        throw new Error("IMPLEMENT ME")
        //callback(s.serialize(this.imp.schemaPath, this.imp.schema.root, this.rootNode))
        this.imp.global.changeController.resetSerializationPosition()
    }
    public undo() {
        this.imp.global.changeController.undo()
    }
    public redo() {
        this.imp.global.changeController.redo()
    }
    public purgeChanges() {
        this.imp.global.changeController.purgeChanges()
        purgeNodeChanges(this.rootNode.imp)
    }

}


class Entry implements asyncAPI.Entry {
    public readonly node: Node
    public readonly hasSubEntryErrors: g.ISubscribableValue<boolean>
    public readonly tempSubEntryErrorsCount: g.ISubscribableValue<number>
    public readonly isAdded: g.ISubscribableValue<boolean>
    public readonly status: g.ISubscribableValue<asyncAPI.EntryStatus>
    private readonly imp: imp.EntryPlaceholder
    constructor(entryImp: imp.EntryPlaceholder) {
        this.imp = entryImp
        this.node = new Node(entryImp.node)
        this.hasSubEntryErrors = entryImp.hasSubEntryErrors
        this.tempSubEntryErrorsCount = entryImp.tempSubEntryErrorsCount
        this.isAdded = entryImp.isAdded
        this.status = entryImp.status
    }
    public delete() {
        if (this.imp.status.get()[0] === "inactive") {
            console.error("trying to delete a already inactive entry")
            return
        }
        this.imp.global.changeController.deleteEntry(new imp.EntryRemoval(this.imp.parent, this.imp))
    }

}

class Property implements asyncAPI.Property {
    public readonly type: asyncAPI.PropertyType

    //public readonly isKeyProperty: boolean
    //private readonly definition: d.Property
    constructor(
        _definition: d.Property,
        type: asyncAPI.PropertyType,
        //isKeyProperty: boolean,
    ) {
        //this.definition = definition
        this.type = type
        //this.isKeyProperty = isKeyProperty
    }
}

class Node implements asyncAPI.Node {
    public readonly imp: imp.Node
    constructor(nodeImp: imp.Node) {
        this.imp = nodeImp
    }
    public forEachProperty(callback: (property: asyncAPI.Property, key: string) => void) {
        this.imp.definition.properties.forEach((p, pKey) => {
            //const isKeyProperty = this.imp.keyProperty === null ? false : p === this.imp.keyProperty
            switch (p.type[0]) {
                case "collection": {
                    //const $ = p.type[1]
                    callback(
                        new Property(
                            p,
                            ["collection", this.getCollection(pKey)],
                            //isKeyProperty,
                        ),
                        pKey
                    )
                    break
                }
                case "component": {
                    callback(
                        new Property(
                            p,
                            ["component", this.getComponent(pKey)],
                            //isKeyProperty,
                        ),
                        pKey
                    )
                    break
                }
                case "state group": {
                    callback(
                        new Property(
                            p,
                            ["state group", this.getStateGroup(pKey)],
                            //isKeyProperty,
                        ),
                        pKey
                    )
                    break
                }
                case "value": {
                    callback(
                        new Property(
                            p,
                            ["value", this.getValue(pKey)],
                            //isKeyProperty,
                        ),
                        pKey
                    )
                    break
                }
                default:
                    assertUnreachable(p.type[0])
            }
        })
    }
    public getCollection(key: string) {
        return new Collection(this.imp.collections.getUnsafe(key))
    }
    public getComponent(key: string) {
        return new Component(this.imp.components.getUnsafe(key))
    }
    public getStateGroup(key: string) {
        return new StateGroup(this.imp.stateGroups.getUnsafe(key))
    }
    public getValue(key: string) {
        return new Value(this.imp.values.getUnsafe(key))
    }
}

class State implements asyncAPI.State {
    public node: Node
    public readonly isCurrentState: g.ISubscribableValue<boolean>
    public readonly key: string
    //private readonly imp: imp.State
    constructor(stateImp: imp.State) {
        //this.imp = stateImp
        this.node = new Node(stateImp.node)
        this.isCurrentState = stateImp.isCurrentState
        this.key = stateImp.key
    }
}

class StateGroup implements asyncAPI.StateGroup {
    public readonly statesOverTime: g.ISubscribableArray<State>
    public readonly changeStatus: g.ISubscribableValue<asyncAPI.StateGroupChangeStatus>
    public readonly createdInNewContext: g.ISubscribableValue<boolean>
    public readonly currentStateKey: g.ISubscribableValue<string>

    private readonly imp: imp.StateGroup
    constructor(stateGroupImp: imp.StateGroup) {
        this.imp = stateGroupImp
        this.statesOverTime = this.imp.statesOverTime.map(stateImp => {
            return new State(stateImp)
        })
        this.changeStatus = stateGroupImp.changeStatus
        this.createdInNewContext = stateGroupImp.createdInNewContext
        this.currentStateKey = stateGroupImp.currentStateKey
    }
    public setMainFocussableRepresentation(focussable: asyncAPI.IFocussable) {
        this.imp.focussable.update(new g.Maybe(focussable))
    }
    public updateState(stateName: string) {
        this.imp.global.changeController.updateState(
            new imp.StateChange(
                this.imp,
                this.imp.currentState.get(),
                new imp.State(
                    stateName,
                    this.imp.definition.states.getUnsafe(stateName),
                    this.imp.global,
                    true,
                )
            )
        )
    }

}


class Value implements asyncAPI.Value {
    public readonly isDuplicate: imp.PotentialError
    public readonly valueIsInvalid: imp.PotentialError
    public readonly focussable: g.ReactiveValue<g.Maybe<asyncAPI.IFocussable>>
    public readonly value: g.ReactiveValue<string>
    public readonly changeStatus: g.ReactiveValue<asyncAPI.ValueChangeStatus>
    public readonly createdInNewContext: g.ReactiveValue<boolean>
    private readonly imp: imp.Value
    constructor(valueImp: imp.Value) {
        this.imp = valueImp
        this.isDuplicate = valueImp.isDuplicate
        this.valueIsInvalid = valueImp.valueIsInvalid
        this.focussable = valueImp.focussable
        this.value = valueImp.value
        this.changeStatus = valueImp.changeStatus
        this.createdInNewContext = valueImp.createdInNewContext
    }
    public updateValue(v: string) {
        this.imp.global.changeController.updateValue(this.imp, v)
    }
    public setMainFocussableRepresentation(f: asyncAPI.IFocussable) {
        this.focussable.update(new g.Maybe(f))
    }
}