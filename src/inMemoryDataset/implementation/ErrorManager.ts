/* eslint
    "max-classes-per-file": off,
*/

import * as g from "../../generics"
import { IFocussable } from "./IFocussable"

export class ValidationError {
    public readonly focussable: g.ReactiveValue<g.Maybe<IFocussable>>
    constructor(focussable: g.ReactiveValue<g.Maybe<IFocussable>>) {
        this.focussable = focussable
    }
}

export class PotentialError {
    public readonly isInErrorState: g.ISubscribableValue<boolean>
    private currentError: null | ValidationError = null
    //private readonly error: g.ReactiveValue<g.Maybe<ValidationError>>
    private readonly errorsAggregator: IParentErrorsAggregator
    private readonly errorManager: ErrorManager
    private readonly focussable: g.ReactiveValue<g.Maybe<IFocussable>>
    constructor(
        isInErrorState: g.ISubscribableValue<boolean>,
        errorsAggregator: IParentErrorsAggregator,
        errorManager: ErrorManager,
        focussable: g.ReactiveValue<g.Maybe<IFocussable>>,
    ) {
        this.isInErrorState = isInErrorState
        this.errorsAggregator = errorsAggregator
        this.errorManager = errorManager
        this.focussable = focussable
        this.isInErrorState.subscribeToValue(inErrorState => {
            if (inErrorState) {
                if (this.currentError === null) {
                    //switching to error
                    errorsAggregator.add(1)
                    const err = new ValidationError(this.focussable)
                    this.currentError = err
                    this.errorManager.validationErrors.addEntry(this.currentError)
                }
            } else {
                if (this.currentError !== null) {
                    //switching to no error
                    errorsAggregator.add(-1)
                    this.errorManager.validationErrors.removeEntry(this.currentError)
                    this.currentError = null
                }
            }
        })
        this.errorsAggregator.isAttached.subscribeToValue(isAtttached => {
            if (isAtttached) {
                if (this.currentError !== null) {
                    this.errorManager.validationErrors.addEntry(this.currentError)
                }
            } else {
                if (this.currentError !== null) {
                    this.errorManager.validationErrors.removeEntry(this.currentError)
                }
            }
        })
    }
}

export interface IParentErrorsAggregator {
    isAttached: g.ISubscribableValue<boolean>
    add(amount: number): void
}

export class FlexibleErrorsAggregator implements IParentErrorsAggregator {
    public readonly isAttached = new g.ReactiveValue<boolean>(true)
    public readonly errorCount = new g.ReactiveValue<number>(0)
    private currentErrorCount = 0
    private readonly parent = new g.Mutable(new g.Maybe<IParentErrorsAggregator>(null))
    constructor() {
        this.errorCount.subscribeToValue(newErrorCount => {
            this.parent.get().ifExists(p => {
                p.add(newErrorCount - this.currentErrorCount)
                this.currentErrorCount = newErrorCount
            })
        })
    }
    public add(errorCount: number): void {
        this.errorCount.update(this.errorCount.get() + errorCount)
    }
    public detach(): void {
        this.parent.get().map(
            p => {
                p.add(-this.errorCount.get())
                this.parent.update(new g.Maybe<IParentErrorsAggregator>(null))
            },
            () => {
                throw new Error("already detached")
            }
        )
    }
    public attach(parent: IParentErrorsAggregator): void {
        this.parent.get().map(
            _p => {
                throw new Error("already attached")
            },
            () => {
                parent.add(this.errorCount.get())
                this.parent.update(new g.Maybe(parent))
            }
        )
    }
}

export class RootErrorsAggregator implements IParentErrorsAggregator {
    public readonly isAttached = new g.ReactiveValue<boolean>(true)
    public readonly errorCount: g.ReactiveValue<number>
    constructor() {
        this.errorCount = new g.ReactiveValue<number>(0)
    }
    public add(errorCount: number):void {
        this.errorCount.update(this.errorCount.get() + errorCount)
    }
}

export class ErrorManager {
    public readonly validationErrors = new g.ReactiveArray<ValidationError>()
}
