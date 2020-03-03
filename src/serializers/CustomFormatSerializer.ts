/* eslint
    max-classes-per-file: "off",
*/

import { ArraySerializer, DictionarySerializer, RootSerializer, StringStream, TypeSerializer, ValueSerializer } from "../serialize/api"

class DummySerializer implements ValueSerializer {
    public unquotedToken() {
        //
    }
    public simpleValue() {
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

export class CustomFormatValueSerializer implements ValueSerializer {
    private readonly out: StringStream
    constructor(out: StringStream) {
        this.out = out
    }
    public simpleValue(value: string) {
        this.out.add(JSON.stringify(value))
    }
    public unquotedToken(value: string) {
        this.out.add(value)
    }
    public type(callback: (os: TypeSerializer) => void) {
        this.out.add(`(`)
        const indented = this.out.indent()
        callback(new TypeSerializer((key, _isFirst, isKeyProperty) => {
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
    public dictionary(callback: (os: DictionarySerializer) => void) {
        this.out.add(`{`)
        const indented = this.out.indent()
        callback(new DictionarySerializer(
            key => {
                indented.newLine()
                indented.add(`"${key}": `)
                return new CustomFormatValueSerializer(indented)
            }
        ))
        this.out.newLine()
        this.out.add(`}`)

    }
    public arrayType(callback: (os: ArraySerializer) => void) {
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
    public list(callback: (os: ArraySerializer) => void) {
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
    public taggedUnion(option: string, callback: (vb: ValueSerializer) => void): void {
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
