/* eslint
    max-classes-per-file: "off",
    no-console: "off",
*/

import * as chai from "chai"
import * as fs from "fs"
import * as path from "path"
import { describe } from "mocha"
import * as astn from "../src"
import * as async from "../src/asyncAPI"
import * as p from "pareto-20"
import { readSchemaFileFromFileSystem } from "../src/readSchemaFileFromFileSystem"
import { makeNativeHTTPrequest } from "../src/makeNativeHTTPrequest"

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
        const actualPath = path.join(".", testDirPath, `${name}.expected.${extension}`)
        console.log("AP", actualPath)
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

describe("main", () => {
    fs.readdirSync(testsDir).forEach(dir => {
        //console.log("test:", dir)
        const testDirPath = path.join(testsDir, dir)
        const serializedDatasetPath = path.join(testDirPath, "data.astn.test")
        //const expectedOutputPath = path.join(testDirPath, "expected.astn.test")
        const expectedIssues = JSON.parse( //eslint-disable-line @typescript-eslint/no-unsafe-assignment
            fs.readFileSync(
                path.join(testDirPath, "issues.json"),
                { encoding: "utf-8" }
            )
        )

        const actualIssues: Issues = []

        const actualSnippets: Snipppets = {}

        // const schemaReferenceResolver = (reference: string) => {
        //     const schemasDir = "./test/schemas"
        //     return astn.deserializeSchemaFromString(
        //         fs.readFileSync(path.join(schemasDir, reference + ".astn-schema"), { encoding: "utf-8" }),
        //         (errorMessage, range) => {
        //             actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
        //         },
        //     )
        // }

        function myFunc(): p.ISafePromise<void> {

            const serializedDataset = fs.readFileSync(serializedDatasetPath, { encoding: "utf-8" })


            return astn.loadDocument(
                serializedDataset,
                serializedDatasetPath,
                makeNativeHTTPrequest,
                readSchemaFileFromFileSystem,
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
                schema => {
                    return astn.createInMemoryDataset(schema)
                }
            ).mapResultRaw(dataset => {
                const out: string[] = []
                astn.serialize(
                    "foo",
                    {
                        schema: dataset.sync.schema,
                        root: dataset.sync.root,
                    },
                    astn.createASTNSerializer(
                        new astn.StringStream(out, 0),
                    ),
                    false,
                )
                deepEqual(
                    testDirPath,
                    "output",
                    "astn.test",
                    str => str,
                    out.join(""),
                    out.join(""),
                )
                // console.log("actual>>>.")
                // console.log(out.join("").split("\n"))
                // console.log("expected>>>.")
                // console.log(expectedOutput.split("\n"))
                // chai.assert.deepEqual(out.join("").split("\n"), expectedOutput.split("\n"))

                deepEqualJSON(testDirPath, "snippets", actualSnippets)

                const actualEvents: Event[] = []
                subscribeToNode(dataset.async.rootNode, actualEvents)
                deepEqualJSON(testDirPath, "events", actualEvents)


            }).catch(
                _e => {
                    if (actualIssues.length === 0) {
                        throw new Error("ERROR FOUND, BUT NOTHING WAS REPORTED")
                    }
                }
            )

        }
        it(dir, async () => {
            return myFunc().convertToNativePromise().then(() => {
                chai.assert.deepEqual(actualIssues, expectedIssues)
            })
        })
    })
})
