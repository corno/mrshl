import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as p from "pareto"
import { SchemaAndSideEffects } from "../../API/CreateSchemaAndSideEffects"
import { ExternalSchemaResolvingError } from "../../API/SchemaErrors"
import { SchemaHost } from "../SchemaHost"

export function createFromURLSchemaDeserializer(
    schemaHost: SchemaHost,
    timeout: number,
    makeHTTPrequest: (
        schemaHost: SchemaHost,
        schema: string,
        timeout: number,
    ) => p.IUnsafeValue<p.IStream<string, null>, string>,
) {
    return (reference: string): p.IUnsafeValue<SchemaAndSideEffects, ExternalSchemaResolvingError> => {

        // //const errors: string[] = []
        // function onSchemaError(_message: string, _range: astn.Range) {
        //     //errors.push(message)
        // }
        if (reference === "") {
            return p.error(["schema id cannot be an empty string"])
        }
        // const options = {
        //     host: schemaHost.host,
        //     /*
        //     the next line feels a bit smelly. I don't want to include a depencency on the 'url' or the 'path' package as they don't
        //     exist in the browser, but I guess there would be a better way than this.
        //      */
        //     path: `${schemaHost.pathStart}/${encodeURI(reference)}`.replace(/\/\//g, "/"),
        //     timeout: timeout,
        // }
        return makeHTTPrequest(
            schemaHost,
            reference,
            timeout
        ).mapError<ExternalSchemaResolvingError>(errorMessage => {
            return p.value(["loading", { message: errorMessage }])
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
                        return p.value(["errors in schema"])
                    },
                )
            },
        )
    }
}