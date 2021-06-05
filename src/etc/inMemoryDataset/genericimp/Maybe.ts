
export class Maybe<T> {
    private readonly t: T | null
    constructor(t: T | null) {
        this.t = t
    }
    public ifExists(callback: (t: T) => void): void {
        if (this.t !== null) {
            callback(this.t)
        }
    }
    public map<RT>(exists: (t: T) => RT, onNotExists: () => RT): RT {
        if (this.t === null) {
            return onNotExists()
        } else {
            return exists(this.t)
        }
    }
}
