/* eslint
    max-classes-per-file: "off",
*/

import * as assert from "assert"
import * as chai from "chai"
import * as fs from "fs"
import * as path from "path"
import { describe } from "mocha"
import { validateDocument, CollectionBuilder, ComponentBuilder, EntryBuilder, NodeBuilder } from "../src"
import * as bc from "bass-clarinet"

const schemasDir = "./test/tests"

type Issue = [string, "warning" | "error", number, number, number, number]

type Issues = Issue[]


export class LoggingCollectionBuilder implements CollectionBuilder {
    public createEntry() {
        return new LoggingEntryBuilder()
    }
}

export class LoggingComponentBuilder implements ComponentBuilder {
    public readonly node = new LoggingNodeBuilder()
}

export class LoggingEntryBuilder implements EntryBuilder {
    public readonly node = new LoggingNodeBuilder()
    public insert() {
        //
    }
}

export class LoggingNodeBuilder implements NodeBuilder {
    constructor() {
        console.log(` node`)

    }
    public setCollection(_name: string, _range: bc.Range) {
        return new LoggingCollectionBuilder()
    }
    public setComponent(_name: string) {
        return new LoggingComponentBuilder()
    }
    public setStateGroup(_name: string, _stateName: string, _range: bc.Range) {
        return new LoggingStateBuilder()
    }
    public setString(_name: string, _value: string, _range: bc.Range, _comments: bc.Comment[]) {
        console.log(`${bc.printLocation(_range.start)} string begin`)
        console.log(`${bc.printLocation(_range.end)} string end`)
    }
    public setNumber(_name: string, _value: number, _range: bc.Range) {
        console.log(`${bc.printLocation(_range.start)} number begin`)
        console.log(`${bc.printLocation(_range.end)} number end`)
    }
    public setBoolean(_name: string, _value: boolean, _range: bc.Range) {
        console.log(`${bc.printLocation(_range.start)} boolean begin`)
        console.log(`${bc.printLocation(_range.end)} boolean end`)
    }
}

export class LoggingStateBuilder {
    public readonly node = new LoggingNodeBuilder()
}

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
            new LoggingNodeBuilder(),
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
