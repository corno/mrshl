import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../schemas"
import { HTTPOptions } from "../makeHTTPrequest"

export function createFromURLSchemaDeserializer(
    host: string,
    pathStart: string,
    timeout: number,
    makeHTTPrequest: (options: HTTPOptions) => p.IUnsafeValue<p.IStream<string, null>, string>,
) {
    return (reference: string): p.IUnsafeValue<SchemaAndSideEffects, string> => {

        // //const errors: string[] = []
        // function onSchemaError(_message: string, _range: bc.Range) {
        //     //errors.push(message)
        // }
        if (reference === "") {
            return p.error(`schema cannot be an empty string`)
        }
        const myUrl = new URL(encodeURI(reference), pathStart)
        const options = {
            host: host,
            path: myUrl.href,
            timeout: timeout,
        }
        return makeHTTPrequest(
            options
        ).mapError(errorMessage => {
            return p.result(errorMessage)
        }).try(
            stream => {
                //console.log("FROM URL")
                const schemaTok = createSchemaDeserializer(
                    message => {
                        //do nothing with errors
                        console.error("SCHEMA ERROR", message)
                    },
                )

                return stream.consume(
                    null,
                    schemaTok,
                ).mapError(
                    () => {
                        const myUrl = new URL(encodeURI(reference), pathStart)
                        return p.result(`errors in schema '${host}${myUrl.href}'`)
                    },
                )
            },
        )
    }
}