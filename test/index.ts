/* eslint
    max-classes-per-file: "off",
    no-console: "off",
*/

import * as chai from "chai"
import * as fs from "fs"
import * as path from "path"
//import * as p20 from "pareto-20"
import * as p from "pareto"
import { describe } from "mocha"
import * as astn from "../src"
import * as bc from "bass-clarinet-typed"
import * as async from "../src/asyncAPI"
import { readFileFromFileSystem } from "../src/readFileFromFileSystem"
import { makeNativeHTTPrequest } from "../src/makeNativeHTTPrequest"
//import { deserializeSchemaFromString } from "../src"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

const testsDir = "./test/tests"

type Issue = [
    string,
    string,
    string,
    number | null,
    number | null,
    number | null,
    number | null,
]

type Issues = Issue[]

type Snipppets = {
    [key: string]: {
        inToken: string[] | null
        afterToken: string[] | null
    }
}

function deepEqual(
    testDirPath: string,
    name: string,
    extension: string,
    parseExpected: (expectedString: string) => any, //eslint-disable-line
    actual: any, //eslint-disable-line
    actualAsString: string,
) {

    const expectedPath = path.join(testDirPath, `${name}.expected.${extension}`)

    const expectedAsString = fs.readFileSync(expectedPath, { encoding: "utf-8" })
    try {
        chai.assert.deepEqual(actual, parseExpected(expectedAsString))
    } catch (e) {
        const actualPath = path.join(".", testDirPath, `${name}.actual.${extension}`)
        fs.writeFileSync(actualPath, actualAsString)
        throw e
    }
}

function deepEqualJSON(
    testDirPath: string,
    name: string,
    actual: any, //eslint-disable-line
) {
    deepEqual(
        testDirPath,
        name,
        "json",
        str => JSON.parse(str),//eslint-disable-line
        actual,
        JSON.stringify(actual, undefined, "\t"),
    )
}


type Event = [string, string?]

function subscribeToNode(node: async.Node, actualEvents: Event[]) {
    node.forEachProperty((prop, propKey) => {
        actualEvents.push(["property", propKey])
        switch (prop.type[0]) {
            case "collection": {
                const $ = prop.type[1]
                $.entries.subscribeToEntries(e => {
                    actualEvents.push(["collection entry"])
                    subscribeToNode(e.entry.node, actualEvents)
                })
                break
            }
            case "component": {
                const $ = prop.type[1]
                subscribeToNode($.node, actualEvents)
                break
            }
            case "state group": {
                const $ = prop.type[1]
                $.currentStateKey.subscribeToValue(state => {
                    actualEvents.push(["current state", state])
                })
                $.statesOverTime.subscribeToEntries(sot => {
                    actualEvents.push(["state", sot.entry.key])
                    subscribeToNode(sot.entry.node, actualEvents)
                })
                break
            }
            case "value": {
                const $ = prop.type[1]
                $.value.subscribeToValue(value => {
                    actualEvents.push(["value", value])
                })
                break
            }
            default:
                assertUnreachable(prop.type[0])
        }
    })
}

export function directoryTests(): void {

    describe("'tests' directory", () => {
        fs.readdirSync(testsDir).forEach(dir => {
            //console.log("test:", dir)
            const testDirPath = path.join(testsDir, dir)
            const serializedDatasetPath = path.join(testDirPath, "data.astn.test")
            //const expectedOutputPath = path.join(testDirPath, "expected.astn.test")
            const expectedIssues: Issues = JSON.parse( //eslint-disable-line @typescript-eslint/no-unsafe-assignment
                fs.readFileSync(
                    path.join(testDirPath, "issues.json"),
                    { encoding: "utf-8" }
                )
            )

            const actualIssues: Issues = []
            const actualEvents: Event[] = []
            const actualSnippets: Snipppets = {}
            const out: string[] = []

            // const schemaReferenceResolver = (reference: string) => {
            //     const schemasDir = "./test/schemas"
            //     return astn.deserializeSchemaFromString(
            //         fs.readFileSync(path.join(schemasDir, reference + ".astn-schema"), { encoding: "utf-8" }),
            //         (errorMessage, range) => {
            //             actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
            //         },
            //     )
            // }

            function myFunc(): p.IValue<void> {

                const serializedDataset = fs.readFileSync(serializedDatasetPath, { encoding: "utf-8" })
                return astn.loadDocument(
                    serializedDataset,
                    serializedDatasetPath,
                    makeNativeHTTPrequest,
                    readFileFromFileSystem,
                    diagnostic => {
                        if (diagnostic.range !== null) {

                            actualIssues.push([
                                diagnostic.source,
                                diagnostic.severity === astn.DiagnosticSeverity.error ? "error" : "warning",
                                diagnostic.message,
                                diagnostic.range.start.line,
                                diagnostic.range.start.column,
                                diagnostic.range.end.line,
                                diagnostic.range.end.column,
                            ])
                        } else {

                            actualIssues.push([
                                diagnostic.source,
                                diagnostic.severity === astn.DiagnosticSeverity.error ? "error" : "warning",
                                diagnostic.message,
                                null,
                                null,
                                null,
                                null,
                            ])
                        }

                    },
                    // (errorMessage, range) => {
                    //     actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
                    // },
                    // (warningMessage, range) => {
                    //     actualIssues.push([warningMessage, "warning", range.start.line, range.start.column, range.end.line, range.end.column])
                    // },
                    [astn.createSnippetsGenerator(
                        (range, getIntraSnippets, getSnippetsAfter) => {
                            actualSnippets[astn.printRange(range)] = {
                                inToken: getIntraSnippets === null ? null : getIntraSnippets(),
                                afterToken: getSnippetsAfter === null ? null : getSnippetsAfter(),
                            }
                        },
                        () => {
                            //
                        },
                    )],
                    (schema, internalSchemaSpecification, compact) => {
                        return astn.createInMemoryDataset(schema, internalSchemaSpecification, compact)
                    }
                ).mapResultRaw(dataset => {
                    astn.serialize(
                        dataset.sync,
                        astn.createASTNSerializer(
                            new astn.StringStream(out, 0),
                        ),
                        false,
                    )

                    subscribeToNode(dataset.async.rootNode, actualEvents)


                }).catch(
                    _e => {
                        if (actualIssues.length === 0) {
                            throw new Error("ERROR FOUND, BUT NOTHING WAS REPORTED")
                        }
                    }
                )
            }
            it(dir, async () => {
                return myFunc().convertToNativePromise(
                ).then(() => {
                    deepEqual(
                        testDirPath,
                        "output",
                        "astn.test",
                        str => str,
                        out.join(""),
                        out.join(""),
                    )
                    deepEqualJSON(testDirPath, "snippets", actualSnippets)
                    deepEqualJSON(testDirPath, "events", actualEvents)
                    chai.assert.deepEqual(actualIssues, expectedIssues)
                })
            })
        })
    })
}

describe("main", () => {
    describe('functions', () => {
        function createDummyParser() {

            const parser = bc.createParser<null, null>(
                err => {
                    console.log(err)
                },
                {
                    onHeaderStart: () => {
                        return {
                            onData: () => {
                                return p.result(false)
                            },
                            onEnd: () => {
                                return p.success<null, null>(null)
                            },
                        }
                    },
                    onCompact: () => {
                        //
                    },
                    onHeaderEnd: () => {
                        return {
                            onData: () => {
                                return p.result(false)
                            },
                            onEnd: () => {
                                return p.success(null)
                            },
                        }
                    },
                }
            )

            console.log("SIMPLE TEST")
            return bc.createStreamTokenizer(
                parser,
                (message, _location) => {
                    console.error("error found", message)
                    //actualEvents.push(["tokenizererror", message])
                },
            )
        }
        // it("from string", () => {
        //     const st = createDummyParser()
        //     return p20.createArray(['! "mrshl/schemaschema@0.1" # ()']).streamify().toUnsafeValue(
        //         null,
        //         data => st.onData(data),
        //         (aborted, endData) => st.onEnd(aborted, endData)
        //     ).convertToNativePromise(() => "error during parsing").then(() => {
        //         //
        //     })
        // })
        it("from http", () => {
            const st = createDummyParser()
            return makeNativeHTTPrequest({
                host: "www.astn.io",
                path:   '/dev/schemas/mrshl/schemaschema@0.1',
                timeout: 7000,
            }).try(stream => {
                return stream.toUnsafeValue<null, null>(
                    null,
                    st,
                ).mapError(() => {
                    return p.result("hmm")
                })
            }).convertToNativePromise(() => "error during parsing").then(() => {
                //
            })
        })
        // it("deserializeSchemaFromString", () => {
        //     return deserializeSchemaFromString(
        //         '! "mrshl/schemaschema@0.1" # ()',
        //         schemaErrorMessage => {
        //             console.log("SEM", schemaErrorMessage)
        //         },
        //     ).mapError(e => {
        //         console.log("!!!!!!", e)
        //         return p.result(e)
        //     }).convertToNativePromise().then(
        //         () => {
        //             //
        //         },
        //         e => {
        //             chai.assert.fail(e)
        //         }
        //     )
        // })
    })
    directoryTests()
})
