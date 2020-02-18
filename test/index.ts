/* eslint
    max-classes-per-file: "off",
*/

import * as assert from "assert"
import * as fs from "fs"
import { describe } from "mocha"
import { validateDocument } from "../src"

const schemasDir = "c:/schemas"

describe("main", () => {
    it("foo", () => {
        const filePath = "./test/tests/foo.x"

        const instance = fs.readFileSync(filePath, { encoding: "utf-8" })
        validateDocument(instance, filePath, schemasDir)
        assert.ok(true, "DUMMY")
    })
})
