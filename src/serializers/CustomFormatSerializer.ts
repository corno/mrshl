import { ArraySerializer, CollectionSerializer, MetaObjectSerializer, ValueSerializer, StringStream, RootSerializer } from "../serialize/api"

class DummySerializer implements ValueSerializer {
    boolean() { }
    number() { }
    string() { }
    metaObject() { }
    collection() { }
    metaArray() { }
    list() { }
    unionType() { }
}

export class CustomFormatValueSerializer implements ValueSerializer {
    private readonly out: StringStream
    constructor(out: StringStream) {
        this.out = out
    }
    boolean(value: boolean) {
        this.out.add(value.toString())
    }
    number(value: number) {
        this.out.add(value.toString())
    }
    string(value: string) {
        this.out.add(JSON.stringify(value))

    }
    metaObject(callback: (os: MetaObjectSerializer) => void) {
        this.out.add(`(`)
        const indented = this.out.indent()
        callback(new MetaObjectSerializer((key, _isFirst, isKeyProperty) => {
            if (isKeyProperty) {
                return new DummySerializer()
            } else {
                indented.newLine()
                indented.add(`"${key}": `)
                return new CustomFormatValueSerializer(this.out.indent())
            }
        }))
        this.out.newLine()
        this.out.add(`)`)

    }
    collection(callback: (os: CollectionSerializer) => void) {
        this.out.add(`{`)
        const indented = this.out.indent()
        callback(new CollectionSerializer(
            (key) => {
                indented.newLine()
                indented.add(`"${key}": `)
                return new CustomFormatValueSerializer(indented)
            }
        ))
        this.out.newLine()
        this.out.add(`}`)

    }
    metaArray(callback: (os: ArraySerializer) => void) {
        this.out.add(`<`)
        const indented = this.out.indent()
        callback(new ArraySerializer(
            () => {

                indented.newLine()
                return new CustomFormatValueSerializer(indented)
            }
        ))
        this.out.newLine()
        this.out.add(`>`)

    }
    list(callback: (os: ArraySerializer) => void) {
        this.out.add(`[`)
        const indented = this.out.indent()
        callback(new ArraySerializer(
            () => {
                indented.newLine()
                return new CustomFormatValueSerializer(indented)
            }
        ))
        this.out.newLine()
        this.out.add(`]`)

    }
    unionType(option: string, callback: (vb: ValueSerializer) => void): void {
        this.out.add(`| "${option}" `)
        callback(new CustomFormatValueSerializer(this.out))

    }
}

export class CustomFormatSerializer implements RootSerializer {
    public root: CustomFormatValueSerializer
    private readonly out: StringStream
    constructor(out: StringStream) {
        this.out = out
        this.root = new CustomFormatValueSerializer(out)
    }
    public schemaReference(sr: string) {
        this.out.add(`! ${JSON.stringify(sr)}`)
    }
}