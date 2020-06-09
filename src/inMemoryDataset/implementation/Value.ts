import * as g from "../../generics"
import * as asyncAPI from "../../asyncAPI"
import * as d from "../../types"
import { IParentErrorsAggregator, PotentialError, ErrorManager } from "./ErrorManager"
import { Comments } from "./Comments"

export type ChangeSubscriber = (oldValue: string, newValue: string) => void

export class Value {
    public readonly isDuplicateImp = new g.ReactiveValue<boolean>(false)
    public readonly isDuplicate: PotentialError
    public readonly valueIsInvalid: PotentialError
    public readonly focussable: g.ReactiveValue<g.Maybe<asyncAPI.IFocussable>>
    public readonly value: g.ReactiveValue<string>
    public readonly changeStatus: g.ReactiveValue<asyncAPI.ValueChangeStatus>
    public readonly createdInNewContext: g.ReactiveValue<boolean>
    public readonly changeSubscribers: ChangeSubscriber[] = []
    public readonly comments = new Comments()
    public readonly isQuoted: boolean
    public readonly initialValue: string

    constructor(
        definition: d.Value,
        errorsAggregator: IParentErrorsAggregator,
        createdInNewContext: boolean,
        errorManager: ErrorManager,
    ) {
        this.initialValue = definition["default value"]
        this.focussable = new g.ReactiveValue<g.Maybe<asyncAPI.IFocussable>>(new g.Maybe<asyncAPI.IFocussable>(null))
        this.value = new g.ReactiveValue<string>(this.initialValue)
        this.isDuplicate = new PotentialError(this.isDuplicateImp, errorsAggregator, errorManager, this.focussable)
        this.valueIsInvalid = new PotentialError(
            ((): g.ISubscribableValue<boolean> => {

                return new g.FixedReactiveValue(false)
                //FIXME
                // switch (definition.type[0]) {
                //     case "number": {
                //         return this.value.map(newValue => newValue === "" || isNaN(Number(newValue)))
                //     }
                //     case "text": {
                //         return new g.FixedReactiveValue(false)
                //     }
                //     default:
                //         return g.assertUnreachable(definition.type[0])
                // }
            })(),
            errorsAggregator,
            errorManager,
            this.focussable
        )
        this.changeStatus = new g.ReactiveValue<asyncAPI.ValueChangeStatus>(["not changed"])
        this.createdInNewContext = new g.ReactiveValue(createdInNewContext)
        this.isQuoted = true //FIXME
    }

    //IValue methods
    // public getValue() {
    //     return this.value.get()
    // }
    // public setValue(newValue: string, _onError?: (messsage: string) => void) {
    //     const previousValue = this.value.get()
    //     if (previousValue === newValue) {
    //         return
    //     } else {
    //         this.value.update(newValue)
    //         this.changeSubscribers.forEach(cs => cs(previousValue, newValue))
    //         if (newValue === this.initialValue) {
    //             this.changeStatus.update(["not changed"])
    //         } else {
    //             this.changeStatus.update(["changed", {
    //                 originalValue: this.initialValue,
    //             }])
    //         }
    //     }
    //     //FIXME call onError
    // }
}

export function setValue(valueProperty: Value, previousValue: string, newValue: string): void {

    valueProperty.value.update(newValue)
    valueProperty.changeSubscribers.forEach(cs => cs(previousValue, newValue))
    if (newValue === valueProperty.initialValue) {
        valueProperty.changeStatus.update(["not changed"])
    } else {
        valueProperty.changeStatus.update(["changed", {
            originalValue: valueProperty.initialValue,
        }])
    }
}