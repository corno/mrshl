#! /usr/bin/env node

import * as fs from "fs"
import * as bc from "bass-clarinet-typed"
import * as schemaschema01 from "../src/schemas/mrshl/schemaschema@0.1"
import * as astn from "../src"
import * as p from "pareto"
import * as p20 from "pareto-20"
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

const parser = astn.createParser(
    () => {
        return {
            onData: () => {
                return p.value(false)
            },
            onEnd: () => {
                return p.success(null)
            },
        }
    },
    () => {
        return schemaschema01.createInternalSchemaBuilder(
            (message, range) => {
                console.error(message, astn.printRange(range))
            }
        )
    },

    (message, range) => {
        console.error(message, astn.printRange(range))
    },
    () => {
        return p.value(false)
    }
)

const st = bc.createStreamPreTokenizer(
    bc.createTokenizer(parser),
    (message, range) => {
        console.error(message, range)
    },
)

p20.createArray([serializedSchema]).streamify().tryToConsume(
    null,
    st
).handle(
    () => {
        console.error("schema was not parsed properly")
    },
    schema => {
        schema["component types"].forEach(ct => {
            generateCode(ct.node)
        })
        console.error("GREAT SUCCESS")
    }
)
