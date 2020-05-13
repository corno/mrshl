import * as url from "url"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as ds from "../datasetAPI"
import { makeHTTPrequest } from "../makeHTTPrequest"
import * as p from "pareto-20"

export function createFromURLSchemaDeserializer(host: string, pathStart: string, timeout: number) {
    return (reference: string): p.IUnsafePromise<ds.Dataset, string> => {

        // //const errors: string[] = []
        // function onSchemaError(_message: string, _range: bc.Range) {
        //     //errors.push(message)
        // }
        if (reference === "") {
            return p.error(`schema cannot be an empty string`)
        }
        const options = {
            host: host,
            path: url.resolve(pathStart, encodeURI(reference)),
            timeout: timeout,
        }
        return makeHTTPrequest(options).try(
            stream => {
                return createSchemaDeserializer(
                    message => {
                        //do nothing with errors
                        console.error("SCHEMA ERROR", message)
                    },
                    schemaTok => {
                        stream.processStream(
                            null,
                            chunk => {
                                schemaTok.write(chunk.toString(), {
                                    pause: () => {
                                        //
                                    },
                                    continue: () => {
                                        //
                                    },
                                })
                            },
                            () => {
                                schemaTok.end()
                            },
                        )
                    },
                ).mapError(
                    () => {
                        return p.result(`errors in schema '${host}${url.resolve(pathStart, encodeURI(reference))}'`)
                    },
                )
            },
        )
    }
}