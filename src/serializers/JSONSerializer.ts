/* eslint
    max-classes-per-file: "off",
*/
import { ArraySerializer, DictionarySerializer as DictionarySerializer, RootSerializer, StringStream, TypeSerializer, ValueSerializer } from "../serialize/api"

class DummySerializer implements ValueSerializer {
    public simpleValue() {
        //
    }
    public unquotedToken() {
        //
    }
    public type() {
        //
    }
    public dictionary() {
        //
    }
    public arrayType() {
        //
    }
    public list() {
        //
    }
    public taggedUnion() {
        //
    }
}

export class JSONValueSerializer implements ValueSerializer {
    private readonly out: StringStream
    constructor(out: StringStream) {
        this.out = out
    }
    public unquotedToken(value: string) {
        this.out.add(value)
    }
    public simpleValue(value: string) {
        this.out.add(JSON.stringify(value))
    }
    public type(callback: (os: TypeSerializer) => void) {
        this.out.add(`{`)
        callback(new TypeSerializer(
            (key, isFirst, isKeyProperty) => {
                if (isKeyProperty) {
                    return new DummySerializer()
                } else {
                    if (!isFirst) {
                        this.out.add(`,`)
                    }
                    this.out.newLine()
                    this.out.add(`"${key}": `)
                    return new JSONValueSerializer(this.out.indent())

                }
            }
        ))
        this.out.newLine()
        this.out.add(`}`)

    }
    public dictionary(callback: (os: DictionarySerializer) => void) {
        this.out.add(`{`)
        callback(new DictionarySerializer(
            (key, isFirst) => {
                if (!isFirst) {
                    this.out.add(`,`)
                }
                this.out.newLine()
                this.out.add(`"${key}": `)
                return new JSONValueSerializer(this.out.indent())
            }
        ))
        this.out.newLine()
        this.out.add(`}`)

    }
    public arrayType(callback: (os: ArraySerializer) => void) {
        this.out.add(`[`)
        callback(new ArraySerializer(
            isFirst => {
                if (!isFirst) {
                    this.out.add(`,`)
                }
                this.out.newLine()
                return new JSONValueSerializer(this.out.indent())
            }
        ))
        this.out.newLine()
        this.out.add(`]`)

    }
    public list(callback: (os: ArraySerializer) => void) {
        this.out.add(`[`)
        callback(new ArraySerializer(
            isFirst => {
                if (!isFirst) {
                    this.out.add(`,`)
                }
                this.out.newLine()
                return new JSONValueSerializer(this.out.indent())
            }
        ))
        this.out.newLine()
        this.out.add(`]`)

    }
    public taggedUnion(option: string, callback: (vb: ValueSerializer) => void): void {
        this.out.add(`[ "${option}", `)
        callback(new JSONValueSerializer(this.out))
        this.out.add(` ]`)

    }
}

export class JSONSerializer implements RootSerializer {
    public root: JSONValueSerializer
    //private readonly out: StringStream
    constructor(out: StringStream) {
        //this.out = out
        this.root = new JSONValueSerializer(out)
    }
    public schemaReference(_sr: string) {
        //this.out.add(`! ${JSON.stringify(sr)}`)
    }
}
