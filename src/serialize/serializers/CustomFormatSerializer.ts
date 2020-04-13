/* eslint
    max-classes-per-file: "off",
*/

import * as serializers from "../serializerAPI"
import { Node } from "../../metaDataSchema"

class DummySerializer implements serializers.ValueSerializer {
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

export class CustomFormatValueSerializer implements serializers.ValueSerializer {
    private readonly out: serializers.StringStream
    constructor(out: serializers.StringStream) {
        this.out = out
    }
    public simpleValue(value: string) {
        this.out.add(JSON.stringify(value))
    }
    public unquotedToken(value: string) {
        this.out.add(value)
    }
    public type(callback: (os: serializers.TypeSerializer) => void) {
        this.out.add(`(`)
        const indented = this.out.indent()
        callback(new serializers.TypeSerializer((key, _isFirst, isKeyProperty) => {
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
    public dictionary(callback: (os: serializers.DictionarySerializer) => void) {
        this.out.add(`{`)
        const indented = this.out.indent()
        callback(new serializers.DictionarySerializer(
            key => {
                indented.newLine()
                indented.add(`"${key}": `)
                return new CustomFormatValueSerializer(indented)
            }
        ))
        this.out.newLine()
        this.out.add(`}`)

    }
    public arrayType(callback: (os: serializers.ArraySerializer) => void) {
        this.out.add(`<`)
        const indented = this.out.indent()
        callback(new serializers.ArraySerializer(
            () => {

                indented.newLine()
                return new CustomFormatValueSerializer(indented)
            }
        ))
        this.out.newLine()
        this.out.add(`>`)

    }
    public list(callback: (os: serializers.ArraySerializer) => void) {
        this.out.add(`[`)
        const indented = this.out.indent()
        callback(new serializers.ArraySerializer(
            () => {
                indented.newLine()
                return new CustomFormatValueSerializer(indented)
            }
        ))
        this.out.newLine()
        this.out.add(`]`)

    }
    public taggedUnion(option: string, callback: (vb: serializers.ValueSerializer) => void): void {
        this.out.add(`| "${option}" `)
        callback(new CustomFormatValueSerializer(this.out))

    }
}

export class CustomFormatSerializer implements serializers.RootSerializer {
    public root: CustomFormatValueSerializer
    private readonly out: serializers.StringStream
    constructor(out: serializers.StringStream) {
        this.out = out
        this.root = new CustomFormatValueSerializer(out)
    }
    public serializeSchema(_sr: Node) {
        this.out.add(`! ${"FIXME"}`)
    }
}
