/* eslint
    "max-classes-per-file": off
*/

import * as asyncAPI from "../../../interfaces/asyncAPI/asyncAPI"
import * as cc from "./changeControl"
import * as def from "../../../deserialize/interfaces/typedParserDefinitions"
import * as g from "./genericimp"
//import * as s from "../serialize"
import * as id from "../../../deserialize/interfaces/buildAPI/IDataset"
import * as iss from "../../../deserialize/interfaces/InternalSchemaSpecification"
import { copyEntry } from "./copyEntry"
import { Global } from "./Global"
import { Command, RootImp } from "./Root"
import * as imp from "./internals"
import { initializeNode } from "./initializeNode"
import { ISubscribableValue } from "../../../interfaces/asyncAPI/generic"
import { State, StateGroup, setInitializedState } from "./internals"
import { IStateChange } from "./changeControl/ChangeController"

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
    node.taggedUnions.forEach(sg => {
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

export function createDataset(
    rootImp: RootImp,
    global: Global,
    _syncDataset: id.IDataset,
): asyncAPI.Dataset {
    class Dataset implements asyncAPI.Dataset {

        public readonly errorAmount: g.ReactiveValue<number>
        public readonly errorManager: imp.ErrorManager

        public readonly commands: g.Dictionary<Command>
        public readonly hasUndoActions: g.ReactiveValue<boolean>
        public readonly hasRedoActions: g.ReactiveValue<boolean>
        public readonly hasUnserializedChanges: ISubscribableValue<boolean>
        public readonly rootNode: asyncAPI.Node

        private readonly imp: RootImp
        //private readonly syncDataset: id.IDataset

        //public readonly rootNode: Node
        constructor(
        ) {
            this.imp = rootImp
            //this.syncDataset = syncDataset
            this.commands = new g.Dictionary({})
            this.rootNode = createNode(rootImp.rootNode, rootImp.schema["root type"].get().node, global)
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
            purgeChanges(rootImp.rootNode)
        }

    }
    return new Dataset()
}

function createNode(
    nodeImp: imp.Node,
    definition: def.NodeDefinition,
    global: Global,
): asyncAPI.Node {
    class Node implements asyncAPI.Node {
        public readonly imp: imp.Node
        private readonly global: Global
        private readonly definition: def.NodeDefinition
        constructor() {
            this.imp = nodeImp
            this.definition = definition
            this.global = global
        }
        public forEachProperty(callback: (property: asyncAPI.Property, key: string) => void): void {
            this.definition.properties.forEach((p, pKey) => {
                //const isKeyProperty = this.imp.keyProperty === null ? false : p === this.imp.keyProperty
                function createProperty(
                    _definition: def.PropertyDefinition,
                    type: asyncAPI.PropertyType,
                ): asyncAPI.Property {
                    return {
                        type: type,
                    }
                }
                switch (p.type[0]) {
                    case "dictionary": {
                        //const $ = p.type[1]
                        callback(
                            createProperty(
                                p,
                                ["collection", this.getCollection(pKey)],
                                //isKeyProperty,
                            ),
                            pKey
                        )
                        break
                    }
                    case "list": {
                        //const $ = p.type[1]
                        callback(
                            createProperty(
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
                            createProperty(
                                p,
                                ["component", this.getComponent(pKey)],
                                //isKeyProperty,
                            ),
                            pKey
                        )
                        break
                    }
                    case "tagged union": {
                        callback(
                            createProperty(
                                p,
                                ["state group", this.getTaggedUnion(pKey)],
                                //isKeyProperty,
                            ),
                            pKey
                        )
                        break
                    }
                    case "string": {
                        callback(
                            createProperty(
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
        public getCollection(key: string): asyncAPI.Collection {
            const propDef = this.definition.properties.getUnsafe(key)
            const nodeDefinition = ((): def.NodeDefinition => {
                switch (propDef.type[0]) {
                    case "dictionary": {
                        const $$ = propDef.type[1]
                        return $$.node
                    }
                    case "list": {
                        const $$ = propDef.type[1]
                        return $$.node
                    }
                    case "component": {
                        throw new Error("unexpected")
                    }
                    case "string": {
                        throw new Error("unexpected")
                    }
                    case "tagged union": {
                        throw new Error("unexpected")
                    }
                    default:
                        return assertUnreachable(propDef.type[0])
                }
            })()
            function createCollection(collectionImp: imp.Collection, nodeDefinition: def.NodeDefinition, global: Global): asyncAPI.Collection {
                class Collection implements asyncAPI.Collection {
                    public readonly entries: g.ReactiveArray<asyncAPI.Entry>
                    private readonly global: Global
                    private readonly imp: imp.Collection
                    constructor() {
                        this.imp = collectionImp
                        this.global = global
                        this.entries = collectionImp.entries.map(e => {
                            const entryImp = e
                            const entry: asyncAPI.Entry = {
                                node: createNode(entryImp.node, nodeDefinition, global),
                                hasSubEntryErrors: entryImp.hasSubEntryErrors,
                                tempSubEntryErrorsCount: entryImp.tempSubEntryErrorsCount,
                                isAdded: entryImp.isAdded,
                                status: entryImp.status,
                                delete: () => {
                                    if (entryImp.status.get()[0] === "inactive") {
                                        console.error("trying to delete a already inactive entry")
                                        return
                                    }
                                    this.global.changeController.deleteEntry(new cc.EntryRemoval(entryImp.parent, entryImp))
                                },
                            }
                            return entry
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
                                copyEntry(
                                    this.imp.nodeDefinition,
                                    sourceEntryImp.entry,
                                    newEntry,
                                    global,
                                )

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
                return new Collection()
            }
            return createCollection(this.imp.collections.getUnsafe(key), nodeDefinition, this.global)
        }
        public getComponent(key: string): asyncAPI.Component {
            const propDef = this.definition.properties.getUnsafe(key)
            if (propDef.type[0] !== "component") {
                throw new Error("unexpected")
            }
            return {
                node: createNode(this.imp.components.getUnsafe(key).node, propDef.type[1].type.get().node, this.global),
            }
        }
        public getTaggedUnion(key: string): asyncAPI.StateGroup {
            const propDef = this.definition.properties.getUnsafe(key)
            if (propDef.type[0] !== "tagged union") {
                throw new Error("unexpected")
            }
            const stateGroupImp = this.imp.taggedUnions.getUnsafe(key)
            const definition = propDef.type[1]
            const global = this.global
            return {
                statesOverTime: stateGroupImp.statesOverTime.map(_stateImp => {
                    return {

                    }
                    // State {
                    //     public node: Node
                    //     public readonly isCurrentState: g.ReactiveValue<boolean>
                    //     public readonly mykey: string
                    //     //private readonly imp: imp.State
                    //     constructor(stateImp: imp.State, definition: def.OptionDefinition, global: Global) {
                    //         //this.imp = stateImp
                    //         this.node = new Node(stateImp.node, definition.node, global)
                    //         this.isCurrentState = stateImp.isCurrentState
                    //         this.mykey = stateImp.key
                    //     }
                    // }

                    //return new State(stateImp, definition.options.getUnsafe(stateImp.key), global)
                }),
                changeStatus: stateGroupImp.changeStatus,
                createdInNewContext: stateGroupImp.createdInNewContext,
                currentStateKey: stateGroupImp.currentStateKey,
                setMainFocussableRepresentation: (focussable: asyncAPI.IFocussable): void => {
                    stateGroupImp.focussable.update(new g.Maybe(focussable))
                },
                updateState: (stateName: string): void => {

                    function attachState(state: State, stateGroup: StateGroup) {

                        state.errorsAggregator.attach(stateGroup.thisEntryErrorsAggregator)
                        state.subentriesErrorsAggregator.attach(stateGroup.subentriesErrorsAggregator)
                    }

                    function detachStateErrors(state: State) {
                        state.errorsAggregator.detach()
                        state.subentriesErrorsAggregator.detach()
                    }

                    class StateChange implements IStateChange {
                        private readonly stateGroup: StateGroup
                        private readonly oldState: State
                        private readonly newState: State
                        constructor(stateGroup: StateGroup, oldState: State, newState: State) {
                            this.stateGroup = stateGroup
                            this.oldState = oldState
                            this.newState = newState
                        }
                        public apply(): void {
                            detachStateErrors(this.oldState)
                            this.oldState.isCurrentState.update(false)
                            this.newState.isCurrentState.update(true)

                            attachState(this.newState, this.stateGroup)

                            this.stateGroup.statesOverTime.addEntry(this.newState)
                            setInitializedState(this.stateGroup, this.newState)
                            if (this.oldState === this.stateGroup.initialState) {
                                this.stateGroup.changeStatus.update(["changed", {
                                    originalStateName: this.stateGroup.initialState.key,
                                }])
                            }
                        }
                        public revert(): void {
                            if (this.oldState === this.stateGroup.initialState) {
                                this.stateGroup.changeStatus.update(["not changed"])
                            } else {
                                this.stateGroup.changeStatus.update(["changed", {
                                    originalStateName: this.stateGroup.initialState.key,
                                }])
                            }
                            setInitializedState(this.stateGroup, this.oldState)
                            this.stateGroup.statesOverTime.removeEntry(this.newState)
                            detachStateErrors(this.newState)
                            this.newState.isCurrentState.update(false)
                            this.oldState.isCurrentState.update(true)
                            attachState(this.oldState, this.stateGroup)
                        }
                    }
                    global.changeController.updateState(
                        new StateChange(
                            stateGroupImp,
                            stateGroupImp.currentState.get(),
                            new imp.State(
                                stateName,
                                (stateNode, errorsAggregator, subentriesErrorsAggregator) => {
                                    initializeNode(
                                        stateNode,
                                        definition.options.getUnsafe(stateName).node,
                                        global.errorManager,
                                        errorsAggregator,
                                        subentriesErrorsAggregator,
                                        true,
                                    )
                                }
                            )
                        )
                    )
                },
            }
        }
        public getValue(key: string): asyncAPI.Value {
            //return new Value(this.imp.values.getUnsafe(key), this.global)
            const global = this.global
            const valueImp = this.imp.values.getUnsafe(key)
            return {
                isDuplicate: valueImp.isDuplicate,
                valueIsInvalid: valueImp.valueIsInvalid,
                value: valueImp.value,
                changeStatus: valueImp.changeStatus,
                createdInNewContext: valueImp.createdInNewContext,
                updateValue: (v: string): void => {
                    global.changeController.updateValue(new cc.ValueUpdate(valueImp), v)
                },
                setMainFocussableRepresentation: (f: asyncAPI.IFocussable): void => {
                    valueImp.focussable.update(new g.Maybe(f))
                },
            }
        }
    }
    return new Node()
}