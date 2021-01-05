/* eslint
    max-classes-per-file: "off",
*/
import * as syncAPI from "../syncAPI"

export class StringStream {
    private readonly str: string[]
    private readonly indentationLevel: null | number
    constructor(str: string[], indentationLevel: null | number) {
        this.str = str
        this.indentationLevel = indentationLevel
    }
    public add(str: string): void {
        this.str.push(str)
    }
    public newLine(): void {
        if (this.indentationLevel !== null) {

            this.str.push("\r\n")
            let indentString = ""
            for (let i = 0; i !== this.indentationLevel; i += 1) {
                indentString += "\t"
            }
            this.str.push(indentString)
        }
    }
    public indent<RT>(callback: (strStr: StringStream) => RT): RT {
        return callback(new StringStream(this.str, this.indentationLevel !== null ? this.indentationLevel + 1 : null))
    }
}

export interface ValueSerializer {
    blockComment(value: string): void
    lineComment(value: string): void
    simpleValue(value: string, quoted: boolean): void
    type(callback: (os: TypeSerializer) => void): void
    dictionary(callback: (os: DictionarySerializer) => void): void
    arrayType(callback: (os: ArraySerializer) => void): void
    list(callback: (os: ArraySerializer) => void): void
    taggedUnion(option: string, callback: (vb: ValueSerializer) => void): void
}

export interface RootSerializer {
    root: ValueSerializer
    serializeHeader(dataset: syncAPI.IDataset, compact: boolean): void
    serializeSchemaReference(schemaReference: string): void
}

export class ArraySerializer {
    private isFirst = true
    private readonly onAdd: (isFirst: boolean) => ValueSerializer

    constructor(onAdd: (isFirst: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    public add(callback: (vb: ValueSerializer) => void): void {
        callback(this.onAdd(this.isFirst))
        this.isFirst = false
    }
}

export class DictionarySerializer {
    private isFirst = true
    private readonly onAdd: (key: string, isFirst: boolean) => ValueSerializer
    constructor(onAdd: (key: string, isFirst: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    public addEntry(key: string, callback: (vb: ValueSerializer) => void): void {
        callback(this.onAdd(key, this.isFirst))
        this.isFirst = false
    }
}
export class TypeSerializer {
    private isFirst = true
    private readonly onAdd: (key: string, isKeyProperty: boolean, isFirst: boolean) => ValueSerializer
    constructor(onAdd: (key: string, isFirst: boolean, isKeyProperty: boolean) => ValueSerializer) {
        this.onAdd = onAdd
    }
    public addProperty(key: string, isKeyProperty: boolean, callback: (vb: ValueSerializer) => void): void {
        callback(this.onAdd(key, this.isFirst, isKeyProperty))
        this.isFirst = false
    }
}
