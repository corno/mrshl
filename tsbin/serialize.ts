import * as fs from "fs"
import * as p from "pareto"
import * as p20 from "pareto-20"
import * as db5 from "../src"
import * as path from "path"
import { schemaHost } from "../schemaHost"
import { SerializationStyle } from "../src/parserSpecific"

export function serialize(style: SerializationStyle): void {

    const [, , sourcePath] = process.argv


    if (sourcePath === undefined) {
        console.error("missing source path")
        process.exit(1)
    }

    const dataAsString = fs.readFileSync(sourcePath, { encoding: "utf-8" })

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
                            console.error(err.code)
                            onError(["other", { description: err.message }])
                        }
                    }
                }
            )
        })
    }

    db5.deserializeTextIntoDataset(
        {

            getContextSchema: readFileFromFileSystem,
            filePath: sourcePath,
        },
        dataAsString,
        schemaID => {
            return db5.makeNativeHTTPrequest(
                schemaHost,
                schemaID,
                3000,
            )
        },
        diagnostic => {
            console.error(db5.printLoadDocumentDiagnostic(diagnostic))
        },
        [],
        schema => {
            return db5.createInMemoryDataset(schema)
        }
    ).mapResult<null>(dataset => {
        return dataset.dataset.serialize(
            dataset.internalSchemaSpecification,
            style,
            $ => process.stdout.write($),
        )
    }).catch(
        _e => {
            console.error("errors encountered")
            return p.value(null)
        }
    ).handle(() => {
        process.stdout.end()
    })
}