import * as p from "pareto-20"

export type HTTPOptions = {
    host: string
    path: string
    timeout: number
}

export type makeHTTPrequest = (options: HTTPOptions) => p.IUnsafePromise<p.IStream<string>, string>