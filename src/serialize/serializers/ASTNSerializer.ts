/* eslint
    max-classes-per-file: "off",
*/

import * as serializers from "../serializerAPI"
import * as syncAPI from "../../syncAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

class DummySerializer implements serializers.ValueSerializer {
    public blockComment() {
        //
    }
    public lineComment() {
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

class ASTNValueSerializer implements serializers.ValueSerializer {
    private readonly out: serializers.StringStream
    constructor(out: serializers.StringStream) {
        this.out = out
    }
    public blockComment(value: string) {
        this.out.add(`/*${value}*/`)
    }
    public lineComment(value: string) {
        this.out.add(`//${value}`)
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
        this.out.newLine()
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

class ASTNSerializer implements serializers.RootSerializer {
    public root: ASTNValueSerializer
    private readonly out: serializers.StringStream
    constructor(out: serializers.StringStream) {
        this.out = out
        this.root = new ASTNValueSerializer(out)
    }
    public serializeHeader(internalSchemaSpecification: syncAPI.InternalSchemaSpecification, compact: boolean) {
        switch (internalSchemaSpecification[0]) {
            case syncAPI.InternalSchemaSpecificationType.Embedded: {
                //const $ = dataset.internalSchemaSpecification[1]
                this.out.add(`! ( FIXME_EMBEDDED_SCHEMA ) `)
                break
            }
            case syncAPI.InternalSchemaSpecificationType.Reference: {
                const $ = internalSchemaSpecification[1]
                this.out.add(`! '${$.name}' `)
                break
            }
            case syncAPI.InternalSchemaSpecificationType.None: {
                //write nothing
                break
            }
            default:
                assertUnreachable(internalSchemaSpecification[0])
        }
        if (compact) {
            this.out.add(`# `)
        }

        //serializeMetaData(dataset.schema, new ASTNValueSerializer(this.out))
    }
    public serializeSchemaReference(schemaReference: string) {
        this.out.add(`! ${JSON.stringify(schemaReference)} `)
    }
}

export function createASTNSerializer(out: serializers.StringStream): serializers.RootSerializer {
    return new ASTNSerializer(out)
}
