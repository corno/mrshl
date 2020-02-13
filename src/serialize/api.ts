/* eslint
    max-classes-per-file: "off",
*/
export class StringStream {
    private readonly str: string[]
    private readonly indentationLevel: null | number
    constructor(str: string[], indentationLevel: null | number) {
        this.str = str
        this.indentationLevel = indentationLevel
    }
    public add(str: string) {
        this.str.push(str)
    }
    public newLine() {
        if (this.indentationLevel !== null) {

            this.str.push("\r\n")
            let indentString = ""
            for (let i = 0; i !== this.indentationLevel; i += 1) {
                indentString += "\t"
            }
            this.str.push(indentString)
        }
    }
    public indent() {
        return new StringStream(this.str, this.indentationLevel !== null ? this.indentationLevel + 1 : null)
    }
}

export interface ValueSerializer {
    boolean(value: boolean): void
    number(value: number): void
    string(value: string): void
    type(callback: (os: TypeSerializer) => void): void
    dictionary(callback: (os: DictionarySerializer) => void): void
    arrayType(callback: (os: ArraySerializer) => void): void
    list(callback: (os: ArraySerializer) => void): void
    taggedUnion(option: string, callback: (vb: ValueSerializer) => void): void
}

export interface RootSerializer {
    root: ValueSerializer
    schemaReference(value: string): void
}

export class ArraySerializer {
    private isFirst = true
    private readonly onAdd: (isFirst: boolean) => ValueSerializer

    constructor(onAdd: (isFirst: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    public add(callback: (vb: ValueSerializer) => void) {
        callback(this.onAdd(this.isFirst))
        this.isFirst = false
    }
}

export class DictionarySerializer {
    private isFirst = true
    private readonly onAdd: (key: string, isKeyProperty: boolean, isFirst: boolean) => ValueSerializer
    constructor(onAdd: (key: string, isFirst: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    public add(key: string, isKeyProperty: boolean, callback: (vb: ValueSerializer) => void) {
        callback(this.onAdd(key, this.isFirst, isKeyProperty))
        this.isFirst = false
    }
}
export class TypeSerializer {
    private isFirst = true
    private readonly onAdd: (key: string, isKeyProperty: boolean, isFirst: boolean) => ValueSerializer
    constructor(onAdd: (key: string, isFirst: boolean, isKeyProperty: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    public add(key: string, isKeyProperty: boolean, callback: (vb: ValueSerializer) => void) {
        callback(this.onAdd(key, this.isFirst, isKeyProperty))
        this.isFirst = false
    }
}
