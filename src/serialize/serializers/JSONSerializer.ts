/* eslint
    max-classes-per-file: "off",
*/
import * as serializers from "../serializerAPI"

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

class JSONValueSerializer implements serializers.ValueSerializer {
    private readonly out: serializers.StringStream
    constructor(out: serializers.StringStream) {
        this.out = out
    }
    public simpleValue(value: string) {
        this.out.add(JSON.stringify(value))
    }
    public type(callback: (os: serializers.TypeSerializer) => void) {
        this.out.add(`{`)
        callback(new serializers.TypeSerializer(
            (key, isFirst, isKeyProperty) => {
                if (isKeyProperty) {
                    return new DummySerializer()
                } else {
                    if (!isFirst) {
                        this.out.add(`,`)
                    }
                    this.out.newLine()
                    this.out.add(`"${key}": `)
                    return this.out.indent(indented => {
                        return new JSONValueSerializer(indented)
                    })

                }
            }
        ))
        this.out.newLine()
        this.out.add(`}`)

    }
    public dictionary(callback: (os: serializers.DictionarySerializer) => void) {
        this.out.add(`{`)
        callback(new serializers.DictionarySerializer(
            (key, isFirst) => {
                if (!isFirst) {
                    this.out.add(`,`)
                }
                this.out.newLine()
                this.out.add(`"${key}": `)
                return this.out.indent(indented => {
                    return new JSONValueSerializer(indented)
                })
            }
        ))
        this.out.newLine()
        this.out.add(`}`)

    }
    public arrayType(callback: (os: serializers.ArraySerializer) => void) {
        this.out.add(`[`)
        callback(new serializers.ArraySerializer(
            isFirst => {
                if (!isFirst) {
                    this.out.add(`,`)
                }
                this.out.newLine()
                return this.out.indent(indented => {
                    return new JSONValueSerializer(indented)
                })
            }
        ))
        this.out.newLine()
        this.out.add(`]`)

    }
    public list(callback: (os: serializers.ArraySerializer) => void) {
        this.out.add(`[`)
        callback(new serializers.ArraySerializer(
            isFirst => {
                if (!isFirst) {
                    this.out.add(`,`)
                }
                this.out.newLine()
                return this.out.indent(indented => {
                    return new JSONValueSerializer(indented)
                })
            }
        ))
        this.out.newLine()
        this.out.add(`]`)

    }
    public taggedUnion(option: string, callback: (vb: serializers.ValueSerializer) => void): void {
        this.out.add(`[ "${option}", `)
        callback(new JSONValueSerializer(this.out))
        this.out.add(` ]`)

    }
}

class JSONSerializer implements serializers.RootSerializer {
    public root: JSONValueSerializer
    //private readonly out: StringStream
    constructor(out: serializers.StringStream) {
        //this.out = out
        this.root = new JSONValueSerializer(out)
    }
    public serializeSchema() {
        //JSON does not know about schemas, output nothing
    }
    public serializeSchemaReference() {
        //JSON does not know about schemas, output nothing
    }
}

export function createJSONSerializer(out: serializers.StringStream): serializers.RootSerializer {
    return new JSONSerializer(out)
}
