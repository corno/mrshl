/* eslint
    max-classes-per-file: "off",
    no-console: "off",
    complexity: "off",
*/

import * as chai from "chai"
import * as fs from "fs"
import * as path from "path"
//import * as p20 from "pareto-20"
import * as p from "pareto"
import { describe } from "mocha"
import * as db5 from "../src"
import * as astn from "astn"
//import * as async from "../src/asyncAPI"
import { makeNativeHTTPrequest } from "../src/implementations/makeNativeHTTPrequest"
//import { deserializeSchemaFromString } from "../src"
import * as p20 from "pareto-20"
import { schemaHost } from "../schemaHost"
import * as astncore from "astn-core"
import { getSchemaSchemaBuilder } from "../src/implementations/getSchemaSchemaBuilder"

function readFileFromFileSystem(
    dir: string,
    schemaFileName: string,
): p.IUnsafeValue<p.IStream<string, null>, db5.RetrievalError> {
    return p20.wrapUnsafeFunction((onError, onSuccess) => {
        fs.readFile(
            path.join(dir, schemaFileName),
            { encoding: "utf-8" },
            (err, data) => {
                if (err === null) {
                    onSuccess(p20.createArray([data]).streamify())
                } else {
                    if (err.code === "ENOENT") {
                        //there is no schema file
                        onError(["not found", {}])
                    } else if (err.code === "EISDIR") {
                        //the path is a directory
                        onError(["not found", {}])
                    } else {
                        console.log(err.code)
                        onError(["other", { description: err.message }])
                    }
                }
            }
        )
    })
}

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

type CodeCompletions = {
    [key: string]: {
        inToken: string[] | null
        afterToken: string[] | null
    }
}

type HoverTexts = {
    [key: string]: {
        hoverText: string | null
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

    //fs.writeFileSync(expectedPath, actualAsString)
    const actualPath = path.join(".", testDirPath, `${name}.actual.${extension}`)

    const expectedAsString = fs.readFileSync(expectedPath, { encoding: "utf-8" })
    try {
        chai.assert.deepEqual(actual, parseExpected(expectedAsString))
    } catch (e) {
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


//type Event = [string, string?]

// function subscribeToNode(node: async.Node, actualEvents: Event[]) {
//     node.forEachProperty((prop, propKey) => {
//         actualEvents.push(["property", propKey])
//         switch (prop.type[0]) {
//             case "collection": {
//                 const $ = prop.type[1]
//                 $.entries.subscribeToEntries(e => {
//                     actualEvents.push(["collection entry"])
//                     subscribeToNode(e.entry.node, actualEvents)
//                 })
//                 break
//             }
//             case "component": {
//                 const $ = prop.type[1]
//                 subscribeToNode($.node, actualEvents)
//                 break
//             }
//             case "tagged union": {
//                 const $ = prop.type[1]
//                 $.currentStateKey.subscribeToValue(state => {
//                     actualEvents.push(["current state", state])
//                 })
//                 $.statesOverTime.subscribeToEntries(sot => {
//                     actualEvents.push(["state", sot.entry.key])
//                     subscribeToNode(sot.entry.node, actualEvents)
//                 })
//                 break
//             }
//             case "string": {
//                 const $ = prop.type[1]
//                 $.value.subscribeToValue(value => {
//                     actualEvents.push(["value", value])
//                 })
//                 break
//             }
//             default:
//                 assertUnreachable(prop.type[0])
//         }
//     })
// }

export function directoryTests(): void {

    describe("'tests' directory", () => {
        fs.readdirSync(testsDir).forEach(dir => {
            const testDirPath = path.join(testsDir, dir)
            const serializedDatasetPath = path.join(testDirPath, "data.astn.test")
            //const expectedOutputPath = path.join(testDirPath, "expected.astn.test")


            const actualIssues: Issues = []
            const actualCodeCompletions: CodeCompletions = {}
            const actualHoverTexts: HoverTexts = {}
            const expanded: string[] = []
            const compact: string[] = []

            // const schemaReferenceResolver = (reference: string) => {
            //     const schemasDir = "./test/schemas"
            //     return astn.deserializeSchemaFromString(
            //         fs.readFileSync(path.join(schemasDir, reference + ".astn-schema"), { encoding: "utf-8" }),
            //         (errorMessage, range) => {
            //             actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
            //         },
            //     )
            // }

            function myFunc(): p.IValue<null> {

                const serializedDataset = fs.readFileSync(serializedDatasetPath, { encoding: "utf-8" })
                return db5.deserializeTextIntoDataset(
                    {

                        getContextSchema: readFileFromFileSystem,
                        filePath: serializedDatasetPath,
                    },
                    serializedDataset,
                    schemaID => {
                        // return makeNativeHTTPrequest(
                        //     schemaHost,
                        //     schemaID,
                        //     3000,
                        // )
                        return readFileFromFileSystem(__dirname + "/../../test/schemas", schemaID)
                    },
                    diagnostic => {
                        const diagSev = diagnostic.severity === astncore.DiagnosticSeverity.error ? "error" : "warning"
                        switch (diagnostic.type[0]) {
                            case "deserialization": {
                                const $ = diagnostic.type[1]
                                const end = astn.getEndLocationFromRange($.range)

                                actualIssues.push([
                                    "deserialization",
                                    diagSev,
                                    db5.printDeserializationDiagnostic($.data),
                                    $.range.start.line,
                                    $.range.start.column,
                                    end.line,
                                    end.column,
                                ])
                                break
                            }
                            case "schema retrieval": {
                                const $ = diagnostic.type[1]

                                actualIssues.push([
                                    "schema retrieval",
                                    diagSev,
                                    (() => {
                                        if ($.issue[0] === "error in external schema") {
                                            const $$ = $.issue[1]
                                            return `${$.issue[0]}: ${db5.printSchemaSchemaError($$)}`
                                        }
                                        return $.issue[0]
                                    })(),
                                    null,
                                    null,
                                    null,
                                    null,
                                ])
                                break
                            }
                            case "structure": {
                                const $ = diagnostic.type[1]

                                actualIssues.push([
                                    "structure",
                                    diagSev,
                                    $.message,
                                    null,
                                    null,
                                    null,
                                    null,
                                ])
                                break
                            }
                            case "validation": {
                                const $ = diagnostic.type[1]
                                const end = astn.getEndLocationFromRange($.range)

                                actualIssues.push([
                                    "validation",
                                    diagSev,
                                    $.message,
                                    $.range.start.line,
                                    $.range.start.column,
                                    end.line,
                                    end.column,
                                ])
                                break
                            }
                            default:
                                assertUnreachable(diagnostic.type[0])
                        }

                    },
                    // (errorMessage, range) => {
                    //     actualIssues.push([errorMessage, "error", range.start.line, range.start.column, range.end.line, range.end.column])
                    // },
                    // (warningMessage, range) => {
                    //     actualIssues.push([warningMessage, "warning", range.start.line, range.start.column, range.end.line, range.end.column])
                    // },
                    [
                        astncore.createCodeCompletionsGenerator(
                            (annotation, getIntraCodeCompletions, getCodeCompletionsAfter) => {
                                if (actualCodeCompletions[astn.printRange(annotation.range)] !== undefined) {
                                    throw new Error(`double registration @ ${astn.printRange(annotation.range)}`)
                                }
                                actualCodeCompletions[astn.printRange(annotation.range)] = {
                                    inToken: getIntraCodeCompletions === null ? null : getIntraCodeCompletions(),
                                    afterToken: getCodeCompletionsAfter === null ? null : getCodeCompletionsAfter(),
                                }
                            },
                            () => {
                                //
                            },
                        ), astncore.createHoverTextsGenerator(
                            (annotation, getHoverText) => {
                                actualHoverTexts[astn.printRange(annotation.range)] = {
                                    hoverText: getHoverText === null ? null : getHoverText(),
                                }
                            },
                            () => {
                                //
                            },
                        ),
                    ],
                    schema => {
                        return db5.createInMemoryDataset(schema)
                    },
                    getSchemaSchemaBuilder,
                ).mapResult<null>(dataset => {
                    return dataset.dataset.serialize(
                        dataset.internalSchemaSpecification,
                        ["expanded", { omitPropertiesWithDefaultValues: true }],
                        $ => expanded.push($),
                    ).mapResult(() => {
                        return dataset.dataset.serialize(
                            dataset.internalSchemaSpecification,
                            ["compact"],
                            $ => compact.push($),
                        )
                    })
                }).catch(
                    _e => {
                        if (actualIssues.length === 0) {
                            throw new Error("ERROR FOUND, BUT NOTHING WAS REPORTED")
                        }
                        return p.value(null)
                    }
                )
            }
            it(dir, async () => {
                return myFunc().convertToNativePromise(
                ).then(() => {
                    //console.log(JSON.stringify(actualIssues))
                    deepEqualJSON(testDirPath, "issues", actualIssues)
                    deepEqual(
                        testDirPath,
                        "output",
                        "verbose.astn",
                        str => str,
                        expanded.join(""),
                        expanded.join(""),
                    )
                    deepEqual(
                        testDirPath,
                        "output",
                        "compact.astn",
                        str => str,
                        compact.join(""),
                        compact.join(""),
                    )
                    deepEqualJSON(testDirPath, "codecompletions", actualCodeCompletions)
                    deepEqualJSON(testDirPath, "hovertexts", actualHoverTexts)
                })
            })
        })
    })
}

describe("main", () => {
    describe('functions', () => {
        function createDummyParser() {

            const parser = astn.createTextParser<null, null>(
                () => {
                    return {
                        onData: () => {
                            return p.value(false)
                        },
                        onEnd: () => {
                            return p.success<null, null>(null)
                        },
                    }
                },
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
                err => {
                    console.log(err)
                },
                () => {
                    return p.value(false)
                }
            )

            console.log("SIMPLE TEST")
            return astn.createStreamPreTokenizer(
                astn.createTokenizer(parser),
                $ => {
                    console.error("error found", $.error)
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
            return makeNativeHTTPrequest(
                schemaHost,
                "mrshl/schemaschema@0.1",
                7000
            ).try(stream => {
                return stream.tryToConsume<null, null>(
                    null,
                    st,
                ).mapError(() => {
                    return p.value(["other", { description: "????" }])
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
        //         return p.value(e)
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
