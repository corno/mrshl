/* eslint
    max-classes-per-file: "off",
*/

import * as bc from "bass-clarinet"
import * as fs from "fs"
import * as path from "path"
import { CollectionBuilder, ComponentBuilder, createDeserializer, createMetaDataDeserializer, EntryBuilder, NodeBuilder, Schema } from "../src"

class DummyCollectionBuilder implements CollectionBuilder {
    public createEntry() {
        return new DummyEntryBuilder()
    }
}

class DummyComponentBuilder implements ComponentBuilder {
    public readonly node = new DummyNodeBuilder()
}

class DummyEntryBuilder implements EntryBuilder {
    public readonly node = new DummyNodeBuilder()
    public insert() {
        //
    }
}

class DummyNodeBuilder implements NodeBuilder {
    public setCollection(_name: string) {
        return new DummyCollectionBuilder()
    }
    public setComponent(_name: string) {
        return new DummyComponentBuilder()
    }
    public setStateGroup(_name: string, _stateName: string) {
        return new DummyStateBuilder()
    }
    public setString(_name: string, _value: string) {
        //
    }
    public setNumber(_name: string, _value: number) {
        //
    }
    public setBoolean(_name: string, _value: boolean) {
        //
    }
}

class DummyStateBuilder {
    public readonly node = new DummyNodeBuilder()
}

class InvalidSchemaError extends Error {
    readonly range: bc.Range
    constructor(message: string, range: bc.Range) {
        super(message)
        this.range = range
    }
}

export function validateDocument(
    document: string,
    schemasDir: string,
    onError: (message: string, range: bc.Range) => void,
    onWarning: (message: string, range: bc.Range) => void,
) {


    const parser = new bc.Parser({
        allow: bc.lax,
        require: {
            schema: true,
        },
    })

    const nodeBuilder = new DummyNodeBuilder()
    const errorContext = new bc.IssueContext(onError, onWarning)

    let metaData: Schema | null = null

    parser.onheaderdata.subscribe({
        oncompact: (isCompact, range) => {
            if (metaData === null) {
                throw new InvalidSchemaError("unexpected; no meta data", range)
            }
            parser.ondata.subscribe(createDeserializer(metaData, errorContext, nodeBuilder, isCompact))
        },
        onschemastart: () => {
            //
        },
        onschemaend: () => {
            //
        },
    })

    parser.onerror.subscribe(err => {
        onError(err.message, err.range)
    })

    parser.onschemadata.subscribe(bc.createStackedDataSubscriber(
        {
            array: range => {
                throw new InvalidSchemaError("unexpected array as schema", range)
            },
            null: range => {
                throw new InvalidSchemaError("unexpected null as schema", range)
            },
            object: createMetaDataDeserializer(md => {
                metaData = md
            }),
            boolean: (_value, range) => {
                throw new InvalidSchemaError("unexpected boolean as schema", range)
            },
            number: (_value, range) => {
                throw new InvalidSchemaError("unexpected number as schema", range)
            },
            string: schemaReference => {
                const serializedSchema = fs.readFileSync(path.join(schemasDir, schemaReference), { encoding: "utf-8" })

                const schemaParser = new bc.Parser({
                    allow: bc.lax,
                })

                schemaParser.ondata.subscribe(bc.createStackedDataSubscriber(
                    {
                        array: range => {
                            throw new InvalidSchemaError("unexpected array as schema", range)
                        },
                        null: range => {
                            throw new InvalidSchemaError("unexpected null as schema", range)
                        },
                        object: createMetaDataDeserializer(md => {
                            metaData = md
                        }),
                        boolean: (_value, range) => {
                            throw new InvalidSchemaError("unexpected value as schema", range)
                        },
                        number: (_value, range) => {
                            throw new InvalidSchemaError("unexpected value as schema", range)
                        },
                        string: (_value, range) => {
                            throw new InvalidSchemaError("unexpected value as schema", range)
                        },
                        taggedUnion: (_value, range) => {
                            throw new InvalidSchemaError("unexpected typed union as schema", range)
                        },
                    },
                    () => {
                        //ignore end comments
                    }
                ))
                schemaParser.onerror.subscribe(err => {
                    throw new InvalidSchemaError(`error in schema ${err.message} ${bc.printRange(err.range)}`, err.range)
                })
                const schemaTok = new bc.Tokenizer(schemaParser)
                schemaTok.write(serializedSchema)
                schemaTok.end()

            },
            taggedUnion: (_value, range) => {
                throw new InvalidSchemaError("unexpected typed union as schema", range)

            },
        },
        () => {
            //ignore end commends
        }
    ))

    const tok = new bc.Tokenizer(parser)
    try {
        tok.write(document)
    } catch (e) {
        if (e instanceof bc.RangeError) {
            onError(e.message, e.range)
        } else if (e instanceof bc.LocationError) {
            onError(e.message, { start: e.location, end: e.location})
        } else {
            throw e
        }
    }
    tok.end()
}
