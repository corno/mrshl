import * as async from "../../interfaces/asyncAPI/asyncAPI"
import * as foo from "./IDataset"

export type IDataset = {
	sync: foo.IDataset
	async: async.Dataset
}