import * as http from "http"
import * as url from "url"
import { createSchemaDeserializer } from "./createSchemaDeserializer"
import * as ds from "../datasetAPI"

export function createFromURLSchemaDeserializer(host: string, pathStart: string, timeout: number) {
    return (reference: string): Promise<ds.Dataset> => {
        return new Promise((resolve, reject) => {

            // //const errors: string[] = []
            // function onSchemaError(_message: string, _range: bc.Range) {
            //     //errors.push(message)
            // }
            const options = {
                host: host,
                path: url.resolve(pathStart, encodeURI(reference)),
                timeout: timeout,
            }
            const request = http.request(options, res => {

                if (res.statusCode !== 200) {
                    reject(`schema '${reference}' not found`)
                    return
                }
                const schemaTok = createSchemaDeserializer(
                    message => {
                        //do nothing with errors
                        console.error("SCHEMA ERROR", message)
                    },
                    schema => {
                        if (schema !== null) {
                            resolve(schema)
                        } else {
                            reject(`errors in schema '${host}${url.resolve(pathStart, encodeURI(reference))}'`)
                        }
                    }
                )
                res.on('data', chunk => {
                    schemaTok.write(chunk.toString(), {
                        pause: () => {
                            //
                        },
                        continue: () => {
                            //
                        },
                    })
                });
                res.on('end', () => {
                    schemaTok.end()
                })
            })
            request.on('timeout', () => {
                console.error("timeout")
                reject("timeout")
            });
            request.on('error', e => {
                console.error(e.message)
                reject(e.message)
            });
            request.end()
        })
    }
}