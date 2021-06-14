import * as fs from "fs"
import * as stream from "stream"
import * as p from "pareto"
import * as p20 from "pareto-20"
import * as db5 from "../src"
import * as path from "path"

export function serialize(style: ["verbose"] | ["shorthand"]) {

    const [, , sourcePath, targetPath] = process.argv


    if (sourcePath === undefined) {
        console.error("missing source path")
        process.exit(1)
    }

    const dataAsString = fs.readFileSync(sourcePath, { encoding: "utf-8" })

    const ws: stream.Writable = targetPath !== undefined
        ? fs.createWriteStream(targetPath, { encoding: "utf-8" })
        : process.stdout


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

    db5.deserializeTextIntoDataset(
        {

            getContextSchema: readFileFromFileSystem,
            filePath: sourcePath,
        },
        dataAsString,
        schemaID => {
            // return makeNativeHTTPrequest(
            //     schemaHost,
            //     schemaID,
            //     3000,
            // )
            return readFileFromFileSystem(__dirname + "/../../test/schemas", schemaID)
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
            $ => ws.write($),
        )
    }).catch(
        _e => {
            console.error("errors encountered")
            return p.value(null)
        }
    ).handle(() => {
        ws.end()
    })
}