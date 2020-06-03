import * as p from "pareto"

export type HTTPOptions = {
    host: string
    path: string
    timeout: number
}

export type MakeHTTPrequest = (options: HTTPOptions) => p.IUnsafeValue<p.IStream<string, null>, string>