#! /usr/bin/env node

import * as fs from "fs"
import * as schemaschema01 from "../src/schemas/mrshl/schemaschema@0.1"
import * as astn from "../src"
//import * as pc from "pareto-compiler"

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

const [, , path] = process.argv

if (path === undefined) {
    console.error("missing path to schema")
    process.exit(1)
}

function readFile(filePath: string) {
    try {
        return fs.readFileSync(filePath, { encoding: "utf-8" })
    } catch (e) {
        return null
    }
}

const serializedSchema = readFile(path)

if (serializedSchema === null) {
    console.error(`schema not found @ ${path}`)
    process.exit(1)
}

const parser = new astn.Parser(
    (message, range) => {
        console.error(message, astn.printRange(range))
    }
)

function generateCode(node: schemaschema01.Node) {
    node.properties.forEach((p, _key) => {
        switch (p.type[0]) {
            case "collection": {
                const $ = p.type[1]
                generateCode($.node)
                switch ($.type[0]) {
                    case "dictionary": {
                        //const $$ = $.type[1]
                        //generateCode($$["key property"])
                        break
                    }
                    case "list": {
                        break
                    }
                    default:
                        assertUnreachable($.type[0])
                }
                break
            }
            case "component": {
                //const $ = p.type[1]
                //generateCode($.type.get().node)
                break
            }
            case "state group": {
                const $ = p.type[1]
                $.states.forEach((state, _stateName) => {
                    generateCode(state.node)
                })
                break
            }
            case "value": {
                const $ = p.type[1]
                //console.log($["default value"])
                switch ($.type[0]) {
                    case "boolean": {
                        break
                    }
                    case "number": {

                        break
                    }
                    case "string": {

                        break
                    }
                    default:
                        assertUnreachable($.type[0])
                }
                break
            }
            default:
                assertUnreachable(p.type[0])
        }
    })
}

schemaschema01.attachSchemaDeserializer2(
    parser,
    (message, range) => {
        console.error(message, astn.printRange(range))
    },
    schema => {
        if (schema === null) {
            console.error("schema was not parsed properly")
        }
        else {
            schema["component types"].forEach(ct => {
                generateCode(ct.node)
            })
            console.error("GREAT SUCCESS")
        }
    }
)

astn.tokenizeString(
    parser,
    (message, range) => {
        console.error(message, range)
    },
    serializedSchema,
)