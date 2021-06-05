/* eslint
   "max-classes-per-file" : "off",
*/

import { ISubscribableValue, Unsubscriber } from "../../../../interfaces/asyncAPI/generic/subscribables"
import { Subscribers } from "./Subscribers"

export class ReactiveValue<T> implements ISubscribableValue<T> {
    private value: T
    private readonly valueSubscribers = new Subscribers<T>()
    private readonly changeSubscribers = new Subscribers<{
        newValue: T
        oldValue: T
    }>()
    constructor(initialValue: T) {
        this.value = initialValue
    }
    public update(value: T): void {
        if (this.value !== value) {
            this.forceUpdate(value)
        }
    }
    public forceUpdate(value: T): void {
        const oldValue = this.value
        this.value = value
        this.valueSubscribers.signal(value)
        this.changeSubscribers.signal({ newValue: value, oldValue: oldValue })
    }
    public subscribeToValue(callback: (value: T) => void): Unsubscriber {
        callback(this.value)
        return this.valueSubscribers.add(callback)
    }
    public get(): T {
        return this.value
    }
    public map<NewT>(callback: (t: T) => NewT): ISubscribableValue<NewT> {
        return new DerivedReactiveValue<T, NewT>(this, callback)
    }
}

export class FixedReactiveValue<Type> implements ISubscribableValue<Type> {
    private readonly value: Type
    constructor(value: Type) {
        this.value = value
    }
    public subscribeToValue(callback: (value: Type) => void): Unsubscriber {
        callback(this.value)
        return (): void => {
            //
        }
    }
    public map<NewType>(callback: (t: Type) => NewType): ISubscribableValue<NewType> {
        return new DerivedReactiveValue<Type, NewType>(this, callback)
    }
}

export class DerivedReactiveValue<SourceType, TargetType> implements ISubscribableValue<TargetType> {
    private readonly parent: ISubscribableValue<SourceType>
    private readonly mapper: (t: SourceType) => TargetType
    constructor(parent: ISubscribableValue<SourceType>, mapper: (t: SourceType) => TargetType) {
        this.parent = parent
        this.mapper = mapper
    }
    public subscribeToValue(callback: (value: TargetType) => void): Unsubscriber {
        return this.parent.subscribeToValue(value => {
            callback(this.mapper(value))
        })
    }
    public map<NewType>(callback: (t: TargetType) => NewType): ISubscribableValue<NewType> {
        return new DerivedReactiveValue<TargetType, NewType>(this, callback)
    }
}

export class LocalValueCache<Type> {
    private value: null | Type = null
    constructor(parent: ISubscribableValue<Type>) {
        parent.subscribeToValue(value => {
            this.value = value
        })
    }
    public map<NT>(
        onSet: (v: Type) => NT,
        onNotSet: () => NT
    ): NT {
        if (this.value === null) {
            return onNotSet()
        } else {
            return onSet(this.value)
        }

    }
    public getValue(): Type | null {
        return this.value
    }
}

export class CombinedReactiveValue<FirstType, SecondType, ResultType> implements ISubscribableValue<ResultType> {
    private readonly firstParent: ISubscribableValue<FirstType>
    private readonly secondParent: ISubscribableValue<SecondType>
    private readonly mapper: (first: FirstType, second: SecondType) => ResultType
    private firstValue: FirstType | null = null
    private secondValue: SecondType | null = null
    constructor(firstParent: ISubscribableValue<FirstType>, secondParent: ISubscribableValue<SecondType>, mapper: (first: FirstType, second: SecondType) => ResultType) {
        this.firstParent = firstParent
        this.secondParent = secondParent
        this.mapper = mapper
    }
    public subscribeToValue(callback: (value: ResultType) => void): Unsubscriber {
        const firstUnsubscriber = this.firstParent.subscribeToValue(value => {
            this.firstValue = value
            if (this.secondValue !== null) {
                callback(this.mapper(value, this.secondValue))
            }
        })
        const secondUnsubscriber = this.secondParent.subscribeToValue(value => {
            this.secondValue = value
            if (this.firstValue !== null) {
                callback(this.mapper(this.firstValue, value))
            }
        })
        return (): void => {
            firstUnsubscriber()
            secondUnsubscriber()
        }
    }
    public map<NewType>(callback: (t: ResultType) => NewType): ISubscribableValue<NewType> {
        return new DerivedReactiveValue<ResultType, NewType>(this, callback)
    }
}

export function createReactiveValue<T>(initialValue: T): ISubscribableValue<T> {
    return new ReactiveValue(initialValue)
}
