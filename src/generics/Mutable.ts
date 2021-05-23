
export class Mutable<T> {
    private t: T
    constructor(t: T) {
        this.t = t
    }
    public update(t: T): void {
        this.t = t
    }
    public get(): T {
        return this.t
    }
}
