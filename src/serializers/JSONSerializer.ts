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

export class JSONValueSerializer implements ValueSerializer {
    private readonly out: StringStream
    constructor(out: StringStream) {
        this.out = out
    }
    boolean(value: boolean) {
        this.out.add(value ? "true" : "false")

    }
    number(value: number) {
        this.out.add(value.toString())

    }
    string(value: string) {
        this.out.add(JSON.stringify(value))

    }
    metaObject(callback: (os: MetaObjectSerializer) => void) {
        this.out.add(`{`)
        callback(new MetaObjectSerializer(
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
    collection(callback: (os: CollectionSerializer) => void) {
        this.out.add(`{`)
        callback(new CollectionSerializer(
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
    metaArray(callback: (os: ArraySerializer) => void) {
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
    list(callback: (os: ArraySerializer) => void) {
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
    unionType(option: string, callback: (vb: ValueSerializer) => void): void {
        this.out.add(`[ "${option}", `)
        callback(new JSONValueSerializer(this.out))
        this.out.add(' ]')

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