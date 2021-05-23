import * as async from "./asyncAPI"
import * as foo from "./API/IDataset"

export type IDataset = {
	sync: foo.IDataset
	async: async.Dataset
}