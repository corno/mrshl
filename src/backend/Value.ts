import * as g from "../generics/index"
import * as bi from "../backendAPI/index"
import * as d from "../definition/index"
import * as rapi from "../readableAPI"
import { IParentErrorsAggregator, PotentialError } from "./ErrorManager"
import { Global } from "./Global"
import { ValueBuilder } from "../serialize-deserialize/index"

export type ChangeSubscriber = (oldValue: string, newValue: string) => void

export class Value implements rapi.ReadableValue, bi.Value, ValueBuilder {
    public readonly isDuplicateImp = new g.ReactiveValue<boolean>(false)
    public readonly isDuplicate: PotentialError
    public readonly isInvalidNumber: PotentialError
    public readonly focussable: g.ReactiveValue<g.Maybe<bi.IFocussable>>
    public readonly value: g.ReactiveValue<string>
    public readonly changeStatus: g.ReactiveValue<bi.ValueChangeStatus>
    public readonly createdInNewContext: g.ReactiveValue<boolean>
    public readonly changeSubscribers: ChangeSubscriber[] = []
    public readonly isQuoted: boolean
    private readonly global: Global
    private readonly initialValue: string

    constructor(
        definition: d.Value,
        errorsAggregator: IParentErrorsAggregator,
        global: Global,
        createdInNewContext: boolean
    ) {
        this.initialValue = definition["default value"]
        this.focussable = new g.ReactiveValue<g.Maybe<bi.IFocussable>>(new g.Maybe<bi.IFocussable>(null))
        this.value = new g.ReactiveValue<string>(this.initialValue)
        this.isDuplicate = new PotentialError(this.isDuplicateImp, errorsAggregator, global.errorManager, this.focussable)
        this.isInvalidNumber = new PotentialError(
            ((): g.ISubscribableValue<boolean> => {

                switch (definition.type[0]) {
                    case "number": {
                        return this.value.map(newValue => newValue === "" || isNaN(Number(newValue)))
                    }
                    case "text": {
                        return new g.FixedReactiveValue(false)
                    }
                    default:
                        return g.assertUnreachable(definition.type[0])
                }
            })(),
            errorsAggregator,
            global.errorManager,
            this.focussable
        )
        this.global = global
        this.changeStatus = new g.ReactiveValue<bi.ValueChangeStatus>(["not changed"])
        this.createdInNewContext = new g.ReactiveValue(createdInNewContext)
        this.isQuoted = true //FIXME
    }
    public setMainFocussableRepresentation(f: bi.IFocussable) {
        this.focussable.update(new g.Maybe(f))
    }
    public updateValue(v: string) {
        this.global.changeController.updateValue(this, v)
    }
    public getValue() {
        return this.value.get()
    }
    public setValue(newValue: string) {
        const previousValue = this.value.get()
        if (previousValue === newValue) {
            return
        } else {
            this.value.update(newValue)
            this.changeSubscribers.forEach(cs => cs(previousValue, newValue))
            if (newValue === this.initialValue) {
                this.changeStatus.update(["not changed"])
            } else {
                this.changeStatus.update(["changed", {
                    originalValue: this.initialValue,
                }])
            }
        }
    }

    public purgeChanges() {
        this.createdInNewContext.update(false)
        if (this.changeStatus.get()[0] !== "not changed") {
            this.changeStatus.forceUpdate(["not changed"])
        }
    }
}

export function createValue($: d.Value, errorsAggregator: IParentErrorsAggregator, global: Global, createdInNewContext: boolean) {
    const value = new Value($, errorsAggregator, global, createdInNewContext)
    return value
}
