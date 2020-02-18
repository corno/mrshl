/* eslint
    max-classes-per-file: "off",
*/

import * as assert from "assert"
import * as bc from "bass-clarinet"
import * as fs from "fs"
import { describe } from "mocha"
import { validateDocument } from "../src"

const schemasDir = "./test/tests"

describe("main", () => {
    it("foo", () => {
        const filePath = "./test/tests/foo.x"

        const instance = fs.readFileSync(filePath, { encoding: "utf-8" })
        validateDocument(
            instance,
            schemasDir,
            (errorMessage, range) => {
                console.error(`${filePath}${bc.printRange(range)} error: ${errorMessage}`)
                //assert.fail(`error: ${errorMessage} @ ${bc.printLocation(location)}`)
            },
            (warningMessage, range) => {
                console.error(`${filePath}${bc.printRange(range)} warning: ${warningMessage}`)
                //assert.fail(`warning: ${warningMessage} @ ${bc.printLocation(location)}`)

            }
        )
        assert.ok(true, "DUMMY")
    })
})
