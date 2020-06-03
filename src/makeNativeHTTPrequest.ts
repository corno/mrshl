import * as http from "http"
import * as p20 from "pareto-20"
import * as p from "pareto"
import { HTTPOptions } from "./makeHTTPrequest"


export function makeNativeHTTPrequest(
    options: HTTPOptions
): p.IUnsafeValue<p.IStream<string, null>, string> {
    return p20.wrapUnsafeFunction((onError, onSucces) => {

        const request = http.request(
            {
                host: options.host,
                path: options.path,
                timeout: options.timeout,
            },
            res => {
                if (res.statusCode !== 200) {
                    onError(`'${options.path}' not found`)
                    return
                }
                //below code is streaming but unstable
                // onSucces(p20.createStream((_limiter, consumer) => {
                //     res.on('data', chunk => {
                //         res.pause()
                //         consumer.onData(chunk.toString()).handle(
                //             _abortRequested => {
                //                 res.resume()
                //             }
                //         )
                //     })
                //     res.on('end', () => {
                //         consumer.onEnd(false, null)
                //     })
                // }))

                let complete = ""
                onSucces(p20.createStream((_limiter, consumer) => {
                    res.on(
                        'data',
                        chunk => {
                            complete += chunk.toString()
                        }
                    )
                    res.on('end', () => {

                        consumer.onData(complete).handle(
                            _abortRequested => {
                                //
                                consumer.onEnd(false, null)
                            }
                        )
                    })
                }))
            }
        )
        request.on('timeout', () => {
            console.error("timeout")
            onError("timeout")
        });
        request.on('error', e => {
            console.error(e.message)
            onError(e.message)
        });
        request.end()
    })
}
