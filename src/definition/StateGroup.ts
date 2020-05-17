/* eslint
    "max-classes-per-file": off
*/

import * as g from "../generics/index"
import * as bi from "../asynAPI"
import * as d from "./index"
import { IStateChange } from "../inMemoryDataset/implementation/ChangeController"
import { FlexibleErrorsAggregator, IParentErrorsAggregator } from "../inMemoryDataset/implementation/ErrorManager"
import { Global } from "../inMemoryDataset/implementation/Global"
import { defaultInitializeNode, Node } from "../inMemoryDataset/implementation/Node"
import { Comments } from "../inMemoryDataset/implementation/Comments"

export class State implements bi.State {
    public readonly key: string
    public readonly errorsAggregator = new FlexibleErrorsAggregator()
    public readonly subentriesErrorsAggregator = new FlexibleErrorsAggregator()
    public readonly node: Node
    public readonly isCurrentState = new g.ReactiveValue<boolean>(true)
    public readonly comments = new Comments()
    public readonly definition: d.State
    constructor(
        key: string,
        definition: d.State,
    ) {
        this.definition = definition
        this.key = key
        this.node = new Node(definition.node, null)
    }
    public purgeChanges() {
        this.node.purgeChanges()
    }
    public getStateKey() {
        return this.key
    }
    public attachErrors(stateGroup: StateGroup) {
        this.errorsAggregator.attach(stateGroup.thisEntryErrorsAggregator)
        this.subentriesErrorsAggregator.attach(stateGroup.subentriesErrorsAggregator)
    }
    public detachErrors() {
        this.errorsAggregator.detach()
        this.subentriesErrorsAggregator.detach()
    }
}

export class StateChange implements IStateChange {
    private readonly stateGroup: StateGroup
    private readonly oldState: State
    private readonly newState: State
    constructor(stateGroup: StateGroup, oldState: State, newState: State) {
        this.stateGroup = stateGroup
        this.oldState = oldState
        this.newState = newState
    }
    public apply() {
        this.oldState.detachErrors()
        this.oldState.isCurrentState.update(false)
        this.newState.isCurrentState.update(true)

        this.newState.attachErrors(this.stateGroup)

        this.stateGroup.statesOverTime.addEntry(this.newState)
        this.stateGroup.currentState.update(this.newState)
        this.stateGroup.currentStateKey.update(this.newState.key)
        if (this.oldState === this.stateGroup.initialState) {
            this.stateGroup.changeStatus.update(["changed", {
                originalStateName: this.stateGroup.initialState.key,
            }])
        }
    }
    public revert() {
        if (this.oldState === this.stateGroup.initialState) {
            this.stateGroup.changeStatus.update(["not changed"])
        } else {
            this.stateGroup.changeStatus.update(["changed", {
                originalStateName: this.stateGroup.initialState.key,
            }])
        }
        this.stateGroup.currentStateKey.update(this.oldState.key)
        this.stateGroup.currentState.update(this.oldState)
        this.stateGroup.statesOverTime.removeEntry(this.newState)
        this.newState.detachErrors()
        this.newState.isCurrentState.update(false)
        this.oldState.isCurrentState.update(true)
        this.oldState.attachErrors(this.stateGroup)
    }
}

export function defaultInitializeState(
    definition: d.State,
    global: Global,
    createdInNewContext: boolean
) {
    const state = new State(definition.key, definition)
    defaultInitializeNode(
        definition.node,
        state.node,
        global,
        state.errorsAggregator,
        state.subentriesErrorsAggregator,
        createdInNewContext
    )
    return state
}

export class StateGroup implements bi.StateGroup {
    // tslint:disable-next-line: variable-name
    public readonly statesOverTime = new g.ReactiveArray<State>()
    public readonly currentState: g.Mutable<State>
    public readonly currentStateKey: g.ReactiveValue<string>
    public readonly createdInNewContext: g.ReactiveValue<boolean>
    public readonly changeStatus: g.ReactiveValue<bi.StateGroupChangeStatus>
    public readonly thisEntryErrorsAggregator: IParentErrorsAggregator
    public readonly subentriesErrorsAggregator: IParentErrorsAggregator
    public readonly global: Global
    public readonly initialState: State
    public readonly definition: d.StateGroup
    public readonly comments = new Comments()

    private readonly focussable: g.ReactiveValue<g.Maybe<bi.IFocussable>>
    constructor(
        definition: d.StateGroup,
        thisEntryErrorsAggregator: IParentErrorsAggregator,
        subentriesErrorsAggregator: IParentErrorsAggregator,
        global: Global,
        createdInNewContext: boolean,
    ) {
        this.definition = definition
        this.global = global

        this.initialState = defaultInitializeState(
            definition["default state"].get(),
            global,
            createdInNewContext
        )
        this.currentState = new g.Mutable<State>(this.initialState)
        this.currentStateKey = new g.ReactiveValue(definition["default state"].name)
        this.focussable = new g.ReactiveValue(new g.Maybe<bi.IFocussable>(null))
        this.thisEntryErrorsAggregator = thisEntryErrorsAggregator
        this.subentriesErrorsAggregator = subentriesErrorsAggregator
        this.createdInNewContext = new g.ReactiveValue(createdInNewContext)
        this.changeStatus = new g.ReactiveValue<bi.StateGroupChangeStatus>(["not changed"])
        this.initialState.attachErrors(this)
        this.statesOverTime.addEntry(this.initialState)
    }
    public setState(stateName: string) {
        throw new Error("PROPERLY IMPLEMENT ME")
        return new State(stateName, this.definition.states.getUnsafe(stateName))
    }
    //THE FRONTEND API METHODS
    public updateState(stateName: string) {
        this.global.changeController.updateState(
            new StateChange(
                this,
                this.currentState.get(),
                defaultInitializeState(
                    this.definition.states.getUnsafe(stateName),
                    this.global,
                    true,
                )
            )
        )
    }

    public setMainFocussableRepresentation(focussable: bi.IFocussable) {
        this.focussable.update(new g.Maybe(focussable))
    }
    public getMainFocussableRepresentation() {
        return this.focussable
    }
    //THE SERIALIZATION API
    public getCurrentState() {
        return this.currentState.get()
    }
    //INTERNAL
    public purgeChanges() {
        this.statesOverTime.removeEntries(sot => {
            return !sot.isCurrentState.get()
        })
        if (this.changeStatus.get()[0] !== "not changed") {
            this.changeStatus.update(["not changed"])
        }
        this.createdInNewContext.update(false)
        this.currentState.get().purgeChanges()
    }
}