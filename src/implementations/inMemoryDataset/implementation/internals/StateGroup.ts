import * as g from "../genericimp"
import * as asyncAPI from "../../../../interfaces/asyncAPI/asyncAPI"
import * as def from "../../../../interfaces/typedParserDefinitions"
import { FlexibleErrorsAggregator, IParentErrorsAggregator, ErrorManager } from "./ErrorManager"
import { Node } from "./Node"
import { Comments } from "./Comments"
import { initializeNode } from "../initializeNode"

export class State {
    public readonly key: string
    public readonly errorsAggregator = new FlexibleErrorsAggregator()
    public readonly subentriesErrorsAggregator = new FlexibleErrorsAggregator()
    public readonly node: Node
    public readonly isCurrentState = new g.ReactiveValue<boolean>(true)
    constructor(
        key: string,
        initializeStateNode: (
            node: Node,
            errorsAggregator: IParentErrorsAggregator,
            subentriesErrorsAggregator: IParentErrorsAggregator,
        ) => void,
    ) {
        this.key = key
        this.node = new Node(
            null,
            node => {
                initializeStateNode(node, this.errorsAggregator, this.subentriesErrorsAggregator)
            },
        )
    }

}

export type StateGroupChangeStatus =
    | ["not changed"]
    | ["changed", {
        readonly originalStateName: string
    }]

export class StateGroup {
    public readonly statesOverTime = new g.ReactiveArray<State>()
    public readonly currentState: g.Mutable<State>
    public readonly currentStateKey: g.ReactiveValue<string>
    public readonly createdInNewContext: g.ReactiveValue<boolean>
    public readonly changeStatus: g.ReactiveValue<StateGroupChangeStatus>
    public readonly thisEntryErrorsAggregator: IParentErrorsAggregator
    public readonly subentriesErrorsAggregator: IParentErrorsAggregator
    public readonly initialState: State
    public readonly comments = new Comments()

    public readonly focussable: g.ReactiveValue<g.Maybe<asyncAPI.IFocussable>>
    constructor(
        definition: def.TaggedUnionDefinition,
        errorManager: ErrorManager,
        thisEntryErrorsAggregator: IParentErrorsAggregator,
        subentriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
    ) {
        this.initialState = new State(
            definition["default option"].name,
            (stateNode, errorsAggregator, stateSubentriesErrorsAggregator) => {
                initializeNode(
                    stateNode,
                    definition["default option"].get().node,
                    errorManager,
                    errorsAggregator,
                    stateSubentriesErrorsAggregator,
                    true
                )
            }
        )
        this.currentState = new g.Mutable<State>(this.initialState)
        this.currentStateKey = new g.ReactiveValue(definition["default option"].name)
        this.focussable = new g.ReactiveValue(new g.Maybe<asyncAPI.IFocussable>(null))
        this.thisEntryErrorsAggregator = thisEntryErrorsAggregator
        this.subentriesErrorsAggregator = subentriesErrorsAggregator
        this.createdInNewContext = new g.ReactiveValue(createdInNewContext)
        this.changeStatus = new g.ReactiveValue<asyncAPI.StateGroupChangeStatus>(["not changed"])

        this.initialState.errorsAggregator.attach(this.thisEntryErrorsAggregator)
        this.initialState.subentriesErrorsAggregator.attach(this.subentriesErrorsAggregator)
        this.statesOverTime.addEntry(this.initialState)
    }
}

export function setState(stateGroup: StateGroup, state: State): void {
    stateGroup.currentState.update(state)
    stateGroup.currentStateKey.update(state.key)
}