import * as url from "url"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto-20"
import { SchemaAndSideEffects } from "../schemas"
import * as bc from "bass-clarinet-typed"
import { HTTPOptions } from "../makeHTTPrequest"

export function createFromURLSchemaDeserializer(
    host: string,
    pathStart: string,
    timeout: number,
    makeHTTPrequest: (options: HTTPOptions) => p.IUnsafePromise<p.IStream<string>, string>,
    onInstanceValidationError: (message: string, range: bc.Range) => void
) {
    return (reference: string): p.IUnsafePromise<SchemaAndSideEffects, string> => {

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
                    onInstanceValidationError,
                    schemaTokenizer => {
                        stream.processStream(
                            null,
                            chunk => {
                                schemaTokenizer.write(chunk.toString(), {
                                    pause: () => {
                                        //
                                    },
                                    continue: () => {
                                        //
                                    },
                                })
                            },
                            () => {
                                schemaTokenizer.end()
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