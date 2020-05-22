import { State, StateGroup, setState } from "../implementation"
import { IStateChange } from "./ChangeController"

function attachState(state: State, stateGroup: StateGroup) {

    state.errorsAggregator.attach(stateGroup.thisEntryErrorsAggregator)
    state.subentriesErrorsAggregator.attach(stateGroup.subentriesErrorsAggregator)
}

function detachStateErrors(state: State) {
    state.errorsAggregator.detach()
    state.subentriesErrorsAggregator.detach()
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
        detachStateErrors(this.oldState)
        this.oldState.isCurrentState.update(false)
        this.newState.isCurrentState.update(true)

        attachState(this.newState, this.stateGroup)

        this.stateGroup.statesOverTime.addEntry(this.newState)
        setState(this.stateGroup, this.newState)
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
        setState(this.stateGroup, this.oldState)
        this.stateGroup.statesOverTime.removeEntry(this.newState)
        detachStateErrors(this.newState)
        this.newState.isCurrentState.update(false)
        this.oldState.isCurrentState.update(true)
        attachState(this.oldState, this.stateGroup)
    }
}