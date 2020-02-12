
export class StringStream {
    private readonly str: string[]
    private readonly indentationLevel: null | number
    constructor(str: string[], indentationLevel: null | number) {
        this.str = str
        this.indentationLevel = indentationLevel
    }
    add(str: string) {
        this.str.push(str)
    }
    newLine() {
        if (this.indentationLevel !== null) {

            this.str.push("\r\n")
            let indentString = ""
            for (let i = 0; i !== this.indentationLevel; i += 1) {
                indentString += "\t"
            }
            this.str.push(indentString)
        }
    }
    indent() {
        return new StringStream(this.str, this.indentationLevel !== null ? this.indentationLevel + 1 : null)
    }
}

export interface ValueSerializer {
    boolean(value: boolean): void
    number(value: number): void
    string(value: string): void
    metaObject(callback: (os: MetaObjectSerializer) => void): void
    collection(callback: (os: CollectionSerializer) => void): void
    metaArray(callback: (os: ArraySerializer) => void): void
    list(callback: (os: ArraySerializer) => void): void
    unionType(option: string, callback: (vb: ValueSerializer) => void): void
}

export interface RootSerializer {
    schemaReference(value: string): void
    root: ValueSerializer
}

export class ArraySerializer {
    private isFirst = true
    private readonly onAdd: (isFirst: boolean) => ValueSerializer

    constructor(onAdd: (isFirst: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    add(callback: (vb: ValueSerializer) => void) {
        callback(this.onAdd(this.isFirst))
        this.isFirst = false
    }
}

export class CollectionSerializer {
    private isFirst = true
    private readonly onAdd: (key: string, isKeyProperty: boolean, isFirst: boolean) => ValueSerializer
    constructor(onAdd: (key: string, isFirst: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    add(key: string, isKeyProperty: boolean, callback: (vb: ValueSerializer) => void) {
        callback(this.onAdd(key, this.isFirst, isKeyProperty))
        this.isFirst = false
    }
}
export class MetaObjectSerializer {
    private isFirst = true
    private readonly onAdd: (key: string, isKeyProperty: boolean, isFirst: boolean) => ValueSerializer
    constructor(onAdd: (key: string, isFirst: boolean, isKeyProperty: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    add(key: string, isKeyProperty: boolean, callback: (vb: ValueSerializer) => void) {
        callback(this.onAdd(key, this.isFirst, isKeyProperty))
        this.isFirst = false
    }
}