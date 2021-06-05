import { Unsubscriber } from "../../../interfaces/asyncAPI/generic/ISubscribableArray"
import { removeFromArray } from "./Array"

export class Subscribers<S> {
    private readonly subscribers: ((value: S) => void)[] = []
    public add(subscriber: (value: S) => void): Unsubscriber {
        this.subscribers.push(subscriber)
        return (): void => {
            //console.log("UNSUBSCRIBING")
            removeFromArray(this.subscribers, s => s === subscriber)
        }
    }
    public signal(value: S): void {
        this.subscribers.forEach(s => s(value))
    }
}
