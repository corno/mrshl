/* eslint
    "max-classes-per-file": off
*/

import * as asyncAPI from "../../interfaces/asyncAPI/asyncAPI"
import * as cc from "./changeControl"
import * as streamVal from "../../interfaces/streamingValidationAPI"
import * as g from "./genericimp"
//import * as s from "../serialize"
import * as id from "../../interfaces/buildAPI/IDataset"
import * as iss from "../interfaces/InternalSchemaSpecification"
import * as syncAPIImp from "./buildAPIImplementation"
import { copyEntry } from "./copyEntry"
import { Global } from "./Global"
import { Command, RootImp } from "./Root"
import * as imp from "./implementation"
import { IFocussable } from "./implementation/IFocussable"
import { initializeNode } from "./initializeNode"
import { ISubscribableValue } from "../../interfaces/asyncAPI/generic"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function purgeChanges(node: imp.Node): void {
    node.collections.forEach(c => {
        c.entries.removeEntries(candidate => {

            candidate.isPurged.update(true)
            return candidate.status.get()[0] === "inactive"
        })
        c.entries.forEach(entry => {
            entry.isAdded.update(false)
            purgeChanges(entry.entry.node)
        })
    })
    node.components.forEach(c => {
        purgeChanges(c.node)
    })
    node.stateGroups.forEach(sg => {
        sg.statesOverTime.removeEntries(sot => {
            return !sot.isCurrentState.get()
        })
        if (sg.changeStatus.get()[0] !== "not changed") {
            sg.changeStatus.update(["not changed"])
        }
        sg.createdInNewContext.update(false)
        purgeChanges(sg.currentState.get().node)
    })
    node.values.forEach(v => {
        v.createdInNewContext.update(false)
        if (v.changeStatus.get()[0] !== "not changed") {
            v.changeStatus.forceUpdate(["not changed"])
        }
    })
}

export class Collection implements asyncAPI.Collection {
    public readonly entries: g.ReactiveArray<Entry>
    private readonly global: Global
    private readonly imp: imp.Collection
    constructor(collectionImp: imp.Collection, nodeDefinition: streamVal.NodeDefinition, global: Global) {
        this.imp = collectionImp
        this.global = global
        this.entries = collectionImp.entries.map(e => {
            return new Entry(e, nodeDefinition, global)
        })
    }
    public copyEntriesToHere(forEach: (callback: (entry: asyncAPI.Entry) => void) => void): void {
        this.global.changeController.copyEntriesToCollection(callback => {
            forEach(sourceEntryImp => {
                if (!(sourceEntryImp instanceof imp.EntryPlaceholder)) {
                    console.error(sourceEntryImp)
                    throw new Error("Unexpected, entry is not an instance of Entry")
                }
                const newEntry = new imp.Entry(
                    this.imp.nodeDefinition,
                    this.global.errorManager,
                    this.imp.dictionary
                )
                const source = new syncAPIImp.Entry(sourceEntryImp.entry, this.imp, this.global)
                const target = new syncAPIImp.Entry(newEntry, this.imp, this.global)
                copyEntry(source, target)

                callback(new cc.EntryAddition(
                    this.imp,
                    new imp.EntryPlaceholder(
                        newEntry,
                        this.imp,
                        true,
                    )
                ))
            })
        })
    }
    public addEntry(): void {
        const entry = new imp.Entry(
            this.imp.nodeDefinition,
            this.global.errorManager,
            this.imp.dictionary,
        )

        this.global.changeController.addEntry(new cc.EntryAddition(
            this.imp,
            new imp.EntryPlaceholder(entry, this.imp, true)
        ))
    }
}

export class Component implements asyncAPI.Component {
    public readonly node: Node
    //private readonly imp: imp.Component
    constructor(componentImp: imp.Component, definition: streamVal.ComponentDefinition, global: Global) {
        //this.imp = componentImp
        this.node = new Node(componentImp.node, definition.type.get().node, global)
    }
}

export class Dataset implements asyncAPI.Dataset {

    public readonly errorAmount: g.ReactiveValue<number>
    public readonly errorManager: imp.ErrorManager

    public readonly commands: g.Dictionary<Command>
    public readonly hasUndoActions: g.ReactiveValue<boolean>
    public readonly hasRedoActions: g.ReactiveValue<boolean>
    public readonly hasUnserializedChanges: ISubscribableValue<boolean>
    public readonly rootNode: Node

    private readonly imp: RootImp
    //private readonly syncDataset: id.IDataset

    //public readonly rootNode: Node
    constructor(
        rootImp: RootImp,
        global: Global,
        _syncDataset: id.IDataset,
    ) {
        this.imp = rootImp
        //this.syncDataset = syncDataset
        this.commands = new g.Dictionary({})
        this.rootNode = new Node(rootImp.rootNode, rootImp.schema["root type"].get().node, global)
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
    public serialize(
        _internalSchemaSpecification: iss.InternalSchemaSpecification,
        _callback: (data: string) => void,
    ): void {
        //const out: string[] = []

        throw new Error("IMPLEMENT ME: SERIALIZE")
        // s.serialize(
        //     this.syncDataset,
        //     internalSchemaSpecification,
        // ).handle(
        //     null,
        //     {
        //         onData: $ => {
        //             out.push($.data)
        //             return p.value(false)
        //         },
        //         onEnd: () => {
        //             //
        //             callback(out.join(""))
        //             this.imp.global.changeController.resetSerializationPosition()
        //         },
        //     }
        // )
    }
    public undo(): void {
        this.imp.global.changeController.undo()
    }
    public redo(): void {
        this.imp.global.changeController.redo()
    }
    public purgeChanges(): void {
        this.imp.global.changeController.purgeChanges()
        purgeChanges(this.rootNode.imp)
    }

}


export class Entry implements asyncAPI.Entry {
    public readonly node: Node
    public readonly hasSubEntryErrors: ISubscribableValue<boolean>
    public readonly tempSubEntryErrorsCount: g.ReactiveValue<number>
    public readonly isAdded: g.ReactiveValue<boolean>
    public readonly status: g.ReactiveValue<asyncAPI.EntryStatus>
    private readonly imp: imp.EntryPlaceholder
    private readonly global: Global
    constructor(entryImp: imp.EntryPlaceholder, nodeDefinition: streamVal.NodeDefinition, global: Global) {
        this.imp = entryImp
        this.node = new Node(entryImp.node, nodeDefinition, global)
        this.hasSubEntryErrors = entryImp.hasSubEntryErrors
        this.tempSubEntryErrorsCount = entryImp.tempSubEntryErrorsCount
        this.isAdded = entryImp.isAdded
        this.status = entryImp.status
        this.global = global
    }
    public delete() {
        if (this.imp.status.get()[0] === "inactive") {
            console.error("trying to delete a already inactive entry")
            return
        }
        this.global.changeController.deleteEntry(new cc.EntryRemoval(this.imp.parent, this.imp))
    }

}

export class Property implements asyncAPI.Property {
    public readonly type: asyncAPI.PropertyType

    //public readonly isKeyProperty: boolean
    //private readonly definition: d.Property
    constructor(
        _definition: streamVal.PropertyDefinition,
        type: asyncAPI.PropertyType,
        //isKeyProperty: boolean,
    ) {
        //this.definition = definition
        this.type = type
        //this.isKeyProperty = isKeyProperty
    }
}

export class Node implements asyncAPI.Node {
    public readonly imp: imp.Node
    private readonly global: Global
    private readonly definition: streamVal.NodeDefinition
    constructor(nodeImp: imp.Node, definition: streamVal.NodeDefinition, global: Global) {
        this.imp = nodeImp
        this.definition = definition
        this.global = global
    }
    public forEachProperty(callback: (property: asyncAPI.Property, key: string) => void): void {
        this.definition.properties.forEach((p, pKey) => {
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
    public getCollection(key: string): Collection {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "collection") {
            throw new Error("unexpected")
        }
        const $ = propDef.type[1]
        const nodeDefinition = ((): streamVal.NodeDefinition => {
            switch ($.type[0]) {
                case "dictionary": {
                    const $$ = $.type[1]
                    return $$.node
                }
                case "list": {
                    const $$ = $.type[1]
                    return $$.node
                }
                default:
                    return assertUnreachable($.type[0])
            }
        })()
        return new Collection(this.imp.collections.getUnsafe(key), nodeDefinition, this.global)
    }
    public getComponent(key: string): Component {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "component") {
            throw new Error("unexpected")
        }
        return new Component(this.imp.components.getUnsafe(key), propDef.type[1], this.global)
    }
    public getStateGroup(key: string): StateGroup {
        const propDef = this.definition.properties.getUnsafe(key)
        if (propDef.type[0] !== "state group") {
            throw new Error("unexpected")
        }
        return new StateGroup(this.imp.stateGroups.getUnsafe(key), propDef.type[1], this.global)
    }
    public getValue(key: string):Value {
        return new Value(this.imp.values.getUnsafe(key), this.global)
    }
}

export class State implements asyncAPI.State {
    public node: Node
    public readonly isCurrentState: g.ReactiveValue<boolean>
    public readonly key: string
    //private readonly imp: imp.State
    constructor(stateImp: imp.State, definition: streamVal.StateDefinition, global: Global) {
        //this.imp = stateImp
        this.node = new Node(stateImp.node, definition.node, global)
        this.isCurrentState = stateImp.isCurrentState
        this.key = stateImp.key
    }
}

export class StateGroup implements asyncAPI.StateGroup {
    public readonly statesOverTime: g.ReactiveArray<State>
    public readonly changeStatus: g.ReactiveValue<asyncAPI.StateGroupChangeStatus>
    public readonly createdInNewContext: g.ReactiveValue<boolean>
    public readonly currentStateKey: g.ReactiveValue<string>
    private readonly global: Global
    private readonly imp: imp.StateGroup
    private readonly definition: streamVal.StateGroupDefinition
    constructor(stateGroupImp: imp.StateGroup, definition: streamVal.StateGroupDefinition, global: Global) {
        this.imp = stateGroupImp
        this.definition = definition
        this.statesOverTime = this.imp.statesOverTime.map(stateImp => {
            return new State(stateImp, definition.states.getUnsafe(stateImp.key), global)
        })
        this.changeStatus = stateGroupImp.changeStatus
        this.createdInNewContext = stateGroupImp.createdInNewContext
        this.currentStateKey = stateGroupImp.currentStateKey
        this.global = global
    }
    public setMainFocussableRepresentation(focussable: IFocussable) {
        this.imp.focussable.update(new g.Maybe(focussable))
    }
    public updateState(stateName: string) {
        this.global.changeController.updateState(
            new cc.StateChange(
                this.imp,
                this.imp.currentState.get(),
                new imp.State(
                    stateName,
                    (stateNode, errorsAggregator, subentriesErrorsAggregator) => {
                        initializeNode(
                            stateNode,
                            this.definition.states.getUnsafe(stateName).node,
                            this.global.errorManager,
                            errorsAggregator,
                            subentriesErrorsAggregator,
                            true,
                        )
                    }
                )
            )
        )
    }

}


export class Value implements asyncAPI.Value {
    public readonly isDuplicate: imp.PotentialError
    public readonly valueIsInvalid: imp.PotentialError
    public readonly focussable: g.ReactiveValue<g.Maybe<asyncAPI.IFocussable>>
    public readonly value: g.ReactiveValue<string>
    public readonly changeStatus: g.ReactiveValue<asyncAPI.ValueChangeStatus>
    public readonly createdInNewContext: g.ReactiveValue<boolean>
    private readonly imp: imp.Value
    private readonly global: Global
    constructor(valueImp: imp.Value, global: Global) {
        this.imp = valueImp
        this.isDuplicate = valueImp.isDuplicate
        this.valueIsInvalid = valueImp.valueIsInvalid
        this.focussable = valueImp.focussable
        this.value = valueImp.value
        this.changeStatus = valueImp.changeStatus
        this.createdInNewContext = valueImp.createdInNewContext
        this.global = global
    }
    public updateValue(v: string) {
        this.global.changeController.updateValue(new cc.ValueUpdate(this.imp), v)
    }
    public setMainFocussableRepresentation(f: asyncAPI.IFocussable) {
        this.focussable.update(new g.Maybe(f))
    }
}