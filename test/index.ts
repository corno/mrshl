/* eslint
    max-classes-per-file: "off",
    no-console: "off",
*/

import * as chai from "chai"
import * as fs from "fs"
import * as path from "path"
import { describe } from "mocha"
import * as astn from "../src"
import * as p from "pareto-20"

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

describe("main", () => {
    fs.readdirSync(testsDir).forEach(dir => {
        //console.log("test:", dir)
        const testDirPath = path.join(testsDir, dir)
        const serializedDatasetPath = path.join(testDirPath, "data.astn.test")
        //const expectedOutputPath = path.join(testDirPath, "expected.astn.test")
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

        function myFunc(): p.ISafePromise<void> {

            const serializedDataset = fs.readFileSync(serializedDatasetPath, { encoding: "utf-8" })
            //const expectedOutput = await fs.promises.readFile(expectedOutputPath, { encoding: "utf-8" })

            return astn.loadDocument(
                serializedDataset,
                serializedDatasetPath,
                astn.readSchemaFileFromFileSystem,
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
                [new astn.SnippetGenerator(() => {
                    //don't do anything with the snippets
                })],
                schema => {
                    return astn.createInMemoryDataset(schema)
                }
            ).mapResultRaw(dataset => {
                const out: string[] = []
                astn.serialize(
                    {
                        schema: dataset.sync.schema,
                        root: dataset.sync.root,
                    },
                    new astn.ASTNSerializer(
                        new astn.StringStream(out, 0),
                    ),
                    false,
                )
                // console.log("actual>>>.")
                // console.log(out.join("").split("\n"))
                // console.log("expected>>>.")
                // console.log(expectedOutput.split("\n"))
                // chai.assert.deepEqual(out.join("").split("\n"), expectedOutput.split("\n"))
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
