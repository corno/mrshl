import * as p from "pareto"
import * as build from "./buildAPI/IDataset"
import { InternalSchemaSpecification } from "./InternalSchemaSpecification"

export type SerializationStyle =
    | ["expanded", { omitPropertiesWithDefaultValues: boolean }]
    | ["compact"]

export type IDataset = {
    build: build.IDataset
    serialize: (
        iss: InternalSchemaSpecification,
        style: SerializationStyle,
        writer: (str: string) => void,
    ) => p.IValue<null>
}