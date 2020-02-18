/* eslint
    max-classes-per-file: "off",
*/

import * as assert from "assert"
import * as chai from "chai"
import * as fs from "fs"
import * as path from "path"
import { describe } from "mocha"
import { validateDocument } from "../src"

const schemasDir = "./test/tests"

type Issue = [string, "warning" | "error", number, number, number, number]

type Issues = Issue[]

describe("main", () => {
    fs.readdirSync(schemasDir).forEach(dir => {
        const testDirPath = path.join(schemasDir, dir)
        const filePath = path.join(testDirPath, "data.x")
        const expectedIssues = JSON.parse(fs.readFileSync(path.join(testDirPath, "issues.json"), { encoding: "utf-8" }))

        const actualIssues: Issues = []

        const data = fs.readFileSync(filePath, { encoding: "utf-8" })
        validateDocument(
            data,
            schemasDir,
            (errorMessage, range) => {
                actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
            },
            (warningMessage, range) => {
                actualIssues.push([warningMessage, "warning", range.start.line, range.start.column, range.end.line, range.end.column])

            }
        )

        it(dir, () => {
            chai.assert.deepEqual(actualIssues, expectedIssues)
            assert.ok(true, "DUMMY")
        })
    })
})
