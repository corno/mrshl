import { State, StateGroup } from "../implementation"
import { IStateChange } from "./ChangeController"

function attachState(state: State, stateGroup: StateGroup) {

    state.errorsAggregator.attach(stateGroup.thisEntryErrorsAggregator)
    state.subentriesErrorsAggregator.attach(stateGroup.subentriesErrorsAggregator)
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

        attachState(this.newState, this.stateGroup)

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
        attachState(this.oldState, this.stateGroup)
    }
}