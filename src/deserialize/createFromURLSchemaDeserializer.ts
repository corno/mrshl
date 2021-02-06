import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects, SchemaReferenceResolvingError } from "../schemas"
import { HTTPOptions } from "../makeHTTPrequest"

export function createFromURLSchemaDeserializer(
    host: string,
    pathStart: string,
    timeout: number,
    makeHTTPrequest: (options: HTTPOptions) => p.IUnsafeValue<p.IStream<string, null>, string>,
) {
    return (reference: string): p.IUnsafeValue<SchemaAndSideEffects, SchemaReferenceResolvingError> => {

        // //const errors: string[] = []
        // function onSchemaError(_message: string, _range: bc.Range) {
        //     //errors.push(message)
        // }
        if (reference === "") {
            return p.error(["schema cannot be an empty string"])
        }
        const options = {
            host: host,
            /*
            the next line feels a bit smelly. I don't want to include a depencency on the 'url' or the 'path' package as they don't
            exist in the browser, but I guess there would be a better way than this.
             */
            path: `${pathStart}/${encodeURI(reference)}`.replace(/\/\//g, "/"),
            timeout: timeout,
        }
        return makeHTTPrequest(
            options
        ).mapError<SchemaReferenceResolvingError>(errorMessage => {
            return p.result(["loading", { message: errorMessage }])
        }).try(
            stream => {
                //console.log("FROM URL")
                const schemaTok = createSchemaDeserializer(
                    message => {
                        //do nothing with errors
                        console.error("SCHEMA ERROR", message)
                    },
                )

                return stream.tryToConsume<SchemaAndSideEffects, null>(
                    null,
                    schemaTok,
                ).mapError(
                    () => {
                        //const myUrl = new URL(encodeURI(reference), pathStart)
                        return p.result(["errors in schema"])
                    },
                )
            },
        )
    }
}