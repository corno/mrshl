import * as http from "http"
import * as p from "pareto-20"
import { HTTPOptions } from "./makeHTTPrequest"


export function makeNativeHTTPrequest(options: HTTPOptions): p.IUnsafePromise<p.IStream<string>, string> {
    return p.wrapUnsafeFunction((onError, onSucces) => {

        const request = http.request(options, res => {
            if (res.statusCode !== 200) {
                onError(`'${options.path}' not found`)
            }
            const stream: p.IInStream<string> = {
                processStream: (_limiter, onData, onEnd) => {
                    res.on(
                        'data',
                        chunk => {
                            onData(chunk.toString(), () => { //eslint-disable-line
                                //
                            })
                        }
                    )
                    res.on('end', () => {
                        onEnd(false)
                    })
                },
            }
            onSucces(p.wrap.Stream(stream))
        })
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
