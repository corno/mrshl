
export class Mutable<T> {
    private t: T
    constructor(t: T) {
        this.t = t
    }
    public update(t: T) {
        this.t = t
    }
    public get() {
        return this.t
    }
}

export type RawObject<T> = { [key: string]: T }
