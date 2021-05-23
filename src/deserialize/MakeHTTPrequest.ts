import * as p from "pareto"
import { SchemaHost } from "."

export type MakeHTTPrequest = (
    schemaHost: SchemaHost,
    schema: string,
    timeout: number,
) => p.IUnsafeValue<p.IStream<string, null>, string>