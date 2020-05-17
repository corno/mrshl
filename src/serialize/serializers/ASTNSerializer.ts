/* eslint
    max-classes-per-file: "off",
*/

import * as serializers from "../serializerAPI"
import * as syncAPI from "../../syncAPI"

class DummySerializer implements serializers.ValueSerializer {
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

export class ASTNValueSerializer implements serializers.ValueSerializer {
    private readonly out: serializers.StringStream
    constructor(out: serializers.StringStream) {
        this.out = out
    }
    public simpleValue(value: string, quoted: boolean) {
        const stringified = JSON.stringify(value)
        this.out.add(quoted ? stringified : stringified.substr(1, stringified.length - 2))
    }
    public type(callback: (os: serializers.TypeSerializer) => void) {
        this.out.add(`(`)
        this.out.indent(indented => {
            callback(new serializers.TypeSerializer((key, _isFirst, isKeyProperty) => {
                if (isKeyProperty) {
                    return new DummySerializer()
                } else {
                    indented.newLine()
                    indented.add(`'${key}': `)
                    return this.out.indent(indented2 => {
                        return new ASTNValueSerializer(indented2)
                    })
                }
            }))
        })
        this.out.add(`)`)
    }
    public dictionary(callback: (os: serializers.DictionarySerializer) => void) {
        this.out.add(`{`)
        this.out.indent(indented => {
            callback(new serializers.DictionarySerializer(
                key => {
                    indented.newLine()
                    indented.add(`'${key}': `)
                    return new ASTNValueSerializer(indented)
                }
            ))
        })
        this.out.newLine()
        this.out.add(`}`)
    }
    public arrayType(callback: (os: serializers.ArraySerializer) => void) {
        this.out.add(`<`)
        this.out.indent(indented => {
            callback(new serializers.ArraySerializer(
                () => {

                    indented.newLine()
                    return new ASTNValueSerializer(indented)
                }
            ))
            this.out.newLine()
            this.out.add(`>`)
        })
    }
    public list(callback: (os: serializers.ArraySerializer) => void) {
        this.out.add(`[`)
        this.out.indent(indented => {
            callback(new serializers.ArraySerializer(
                () => {
                    indented.newLine()
                    return new ASTNValueSerializer(indented)
                }
            ))
        })
        this.out.newLine()
        this.out.add(`]`)

    }
    public taggedUnion(option: string, callback: (vb: serializers.ValueSerializer) => void): void {
        this.out.add(`| '${option}' `)
        callback(new ASTNValueSerializer(this.out))
    }
}

export class ASTNSerializer implements serializers.RootSerializer {
    public root: ASTNValueSerializer
    private readonly out: serializers.StringStream
    constructor(out: serializers.StringStream) {
        this.out = out
        this.root = new ASTNValueSerializer(out)
    }
    public serializeSchema(_dataset: syncAPI.Dataset) {
        this.out.add(`! "FIXME"`)
        //serializeMetaData(dataset.schema, new ASTNValueSerializer(this.out))
    }
    public serializeSchemaReference(schemaReference: string) {
        this.out.add(`! ${JSON.stringify(schemaReference)}`)
    }
}
