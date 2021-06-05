
export type Unsubscriber = () => void


export interface IMaybe<T> {
    ifExists(callback: (t: T) => void): void
    map<RT>(exists: (t: T) => RT, onNotExists: () => RT): RT
}

export interface ISubscribableValue<T> {
    subscribeToValue(callback: (value: T) => void): Unsubscriber
    map<NewT>(callback: (t: T) => NewT): ISubscribableValue<NewT>
}

export interface ReactiveEntry {
    subscribeToDeletion(subscriber: () => void): Unsubscriber
}

export interface ISubscribableArray {
    subscribeToEntries(subscriber: (newEntry: ReactiveEntry) => void): Unsubscriber
}