import { removeFromArray } from "./generics"

export class Subscribers<S> {
    private readonly subscribers: ((value: S) => void)[] = []
    public add(subscriber: (value: S) => void): Unsubscriber {
        this.subscribers.push(subscriber)
        return () => {
            //console.log("UNSUBSCRIBING")
            removeFromArray(this.subscribers, s => s === subscriber)
        }
    }
    public signal(value: S) {
        this.subscribers.forEach(s => s(value))
    }
}

export type Unsubscriber = () => void