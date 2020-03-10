/* eslint
    max-classes-per-file: "off",
    no-console: "off",
*/

import * as chai from "chai"
import * as fs from "fs"
import * as path from "path"
import { describe } from "mocha"
import * as astn from "../src"
import * as bc from "bass-clarinet"

const testsDir = "./test/tests"

type Issue = [string, "warning" | "error", number, number, number, number]

type Issues = Issue[]


export class LoggingCollectionBuilder implements astn.CollectionBuilder {
    public createEntry() {
        return new LoggingEntryBuilder()
    }
}

export class LoggingComponentBuilder implements astn.ComponentBuilder {
    public readonly node = new LoggingNodeBuilder()
}

export class LoggingEntryBuilder implements astn.EntryBuilder {
    public readonly node = new LoggingNodeBuilder()
    public insert() {
        //
    }
}

export class LoggingNodeBuilder implements astn.NodeBuilder {
    constructor() {
        //
    }
    public setCollection(_name: string) {
        return new LoggingCollectionBuilder()
    }
    public setComponent(_name: string) {
        return new LoggingComponentBuilder()
    }
    public setStateGroup(_name: string, _stateName: string, _range: bc.Range) {
        return new LoggingStateBuilder()
    }
    public setSimpleValue(_name: string, _value: string, _quoted: boolean, _range: bc.Range, _preData: bc.PreData) {

        // console.log(`${bc.printLocation(_range.start)} string begin`)
        // console.log(`${bc.printLocation(_range.end)} string end`)
    }
}

export class LoggingStateBuilder {
    public readonly node = new LoggingNodeBuilder()
}

describe("main", () => {
    fs.readdirSync(testsDir).forEach(dir => {
        //console.log("test:", dir)
        const testDirPath = path.join(testsDir, dir)
        const filePath = path.join(testDirPath, "data.astn.test")
        const schemaPath = path.join(testDirPath, "schema.astn-schema")
        const expectedIssues = JSON.parse(fs.readFileSync(path.join(testDirPath, "issues.json"), { encoding: "utf-8" }))

        const actualIssues: Issues = []

        // const schemaReferenceResolver = (reference: string) => {
        //     const schemasDir = "./test/schemas"
        //     return astn.deserializeSchemaFromString(
        //         fs.readFileSync(path.join(schemasDir, reference + ".astn-schema"), { encoding: "utf-8" }),
        //         (errorMessage, range) => {
        //             actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
        //         },
        //     )
        // }

        /***** THIS REQUIRES AN INTERNET CONNECTION */
        const schemaReferenceResolver = astn.createFromURLSchemaDeserializer('www.astn.io', '/dev/schemas/', 7000)

        async function myFunc(): Promise<void> {

            const data = await fs.promises.readFile(filePath, { encoding: "utf-8" })

            const serializedSchemaPromise = fs.promises.readFile(schemaPath, { encoding: "utf-8" })
            return serializedSchemaPromise
                .then(serializedSchema => {
                    astn.deserializeSchemaFromString(
                        serializedSchema,
                        (errorMessage, range) => {
                            actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
                        },
                    ).then(schemaAndNodeValidator => {
                        return astn.validateDocument(
                            data,
                            schemaAndNodeValidator,
                            new LoggingNodeBuilder(),
                            schemaReferenceResolver,
                            (errorMessage, range) => {
                                actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
                            },
                            (warningMessage, range) => {
                                actualIssues.push([warningMessage, "warning", range.start.line, range.start.column, range.end.line, range.end.column])
                            },
                            () => {
                                //
                            },
                        ).catch(e => {
                            if (e !== "errors in schema" && e !== "no schema") {
                                throw new Error(`UNEXPECTED: SCHEMA EXCEPTION, ${e}`)
                            }
                            if (actualIssues.length === 0) {
                                throw new Error("MISSING ISSUES")
                            }
                        })
                    })
                })
                .catch(err => {
                    if (err.code === "ENOENT") {
                        return astn.validateDocument(
                            data,
                            null,
                            new LoggingNodeBuilder(),
                            schemaReferenceResolver,
                            (errorMessage, range) => {
                                actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
                            },
                            (warningMessage, range) => {
                                actualIssues.push([warningMessage, "warning", range.start.line, range.start.column, range.end.line, range.end.column])
                            },
                            () => {
                                //
                            },
                        ).catch(e => {
                            if (e !== "errors in schema" && e !== "no schema") {
                                throw new Error(`UNEXPECTED: SCHEMA EXCEPTION, ${e}`)
                            }
                            if (actualIssues.length === 0) {
                                throw new Error("MISSING ISSUES")
                            }
                        })
                    } else {
                        throw new Error("UNKNOWN FS ERROR")
                    }
                })

        }

        it(dir, () => {
            return myFunc().then(() => {
                chai.assert.deepEqual(actualIssues, expectedIssues)
            })
        })
    })
})
