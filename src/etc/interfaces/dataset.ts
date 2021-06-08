import * as p from "pareto"
import * as async from "../../interfaces/asyncAPI/asyncAPI"
import * as build from "../../interfaces/buildAPI/IDataset"
import { InternalSchemaSpecification } from "./InternalSchemaSpecification"

export type IDataset = {
	build: build.IDataset
	async: async.Dataset
    serialize: (
        iss: InternalSchemaSpecification,
        writer: (str: string) => void
    ) => p.IValue<null>
}