//tslint:disable: max-classes-per-file
import * as assert from "assert"
import * as bc from "bass-clarinet"
import * as fs from "fs"
import { describe } from "mocha"
import * as path from "path"
import { CollectionBuilder, ComponentBuilder, createDeserializer, createMetaDataDeserializer, EntryBuilder, NodeBuilder, Schema } from "../src"

const schemasDir = "./test/tests"

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
    public insert() { }
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
    public setString(_name: string, _value: string) { }
    public setNumber(_name: string, _value: number) { }
    public setBoolean(_name: string, _value: boolean) { }
}

class DummyStateBuilder {
    public readonly node = new DummyNodeBuilder()
}

describe("main", () => {
    it("foo", () => {

        const instance = fs.readFileSync("./test/tests/foo.x", { encoding: "utf-8" })

        const parser = new bc.Parser({
            allow: bc.lax,
            require_schema: true,
        })

        const nodeBuilder = new DummyNodeBuilder()
        const errorContext = new bc.ErrorContext(
            (errorMessage, location) => {
                console.error(`error: ${errorMessage} @ ${bc.printLocation(location)}`)
                assert.fail(`error: ${errorMessage} @ ${bc.printLocation(location)}`)
            },
            (warningMessage, location) => {
                console.error(`warning: ${warningMessage} @ ${bc.printLocation(location)}`)
                assert.fail(`warning: ${warningMessage} @ ${bc.printLocation(location)}`)

            }
        )

        let metaData: Schema | null = null

        parser.onheaderdata.subscribe({
            oncompact: isCompact => {
                if (metaData === null) {
                    throw new Error("unexpected; no meta data")
                }
                parser.ondata.subscribe(createDeserializer(metaData, errorContext, nodeBuilder, isCompact))
            },
            onschemastart: () => { },
            onschemaend: () => { },
        })

        parser.onschemadata.subscribe(bc.createStackedDataSubscriber(
            {
                array: () => {
                    throw new Error("unexpected array as schema")
                },
                null: () => {
                    throw new Error("unexpected null as schema")
                },
                object: createMetaDataDeserializer(md => {
                    metaData = md
                }),
                simpleValue: schemaReference => {
                    if (typeof schemaReference !== "string") {
                        throw new Error("unexpected value as schema")
                    }
                    const serializedSchema = fs.readFileSync(path.join(schemasDir, schemaReference), { encoding: "utf-8" })

                    const schemaParser = new bc.Parser({
                        allow: bc.lax,
                    })

                    schemaParser.ondata.subscribe(bc.createStackedDataSubscriber(
                        {
                            array: () => {
                                throw new Error("unexpected array as schema")
                            },
                            null: () => {
                                throw new Error("unexpected null as schema")
                            },
                            object: createMetaDataDeserializer(md => {
                                metaData = md
                            }),
                            simpleValue: () => {
                                throw new Error("unexpected value as schema")
                            },
                            taggedUnion: () => {
                                throw new Error("unexpected typed union as schema")
                            },
                        },
                        () => {
                            //ignore end comments
                        }
                    ))
                    schemaParser.write(serializedSchema)
                    schemaParser.end()

                },
                taggedUnion: () => {
                    throw new Error("unexpected typed union as schema")

                },
            },
            () => {
                //ignore end commends
            }
        ))

        parser.write(instance)
        parser.end()
    })
})
