import * as g from "../../generics"
import * as asyncAPI from "../../asyncAPI"
import * as d from "../../definition"
import { FlexibleErrorsAggregator, IParentErrorsAggregator, ErrorManager } from "./ErrorManager"
import { Node } from "./Node"
import { Comments } from "./Comments"

export class State {
    public readonly key: string
    public readonly errorsAggregator = new FlexibleErrorsAggregator()
    public readonly subentriesErrorsAggregator = new FlexibleErrorsAggregator()
    public readonly node: Node
    public readonly isCurrentState = new g.ReactiveValue<boolean>(true)
    public readonly comments = new Comments()
    constructor(
        key: string,
        definition: d.State,
        errorManager: ErrorManager,
        createdInNewContext: boolean,
    ) {
        this.key = key
        this.node = new Node(
            definition.node,
            errorManager,
            this.errorsAggregator,
            this.subentriesErrorsAggregator,
            createdInNewContext,
            null
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
        definition: d.StateGroup,
        errorManager: ErrorManager,
        thisEntryErrorsAggregator: IParentErrorsAggregator,
        subentriesErrorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
    ) {
        this.initialState = new State(
            definition["default state"].name,
            definition["default state"].get(),
            errorManager,
            createdInNewContext
        )
        this.currentState = new g.Mutable<State>(this.initialState)
        this.currentStateKey = new g.ReactiveValue(definition["default state"].name)
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