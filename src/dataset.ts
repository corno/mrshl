import * as sync from "./syncAPI"
import * as async from "./asyncAPI"

export type IDataset = {
	sync: sync.IDataset
	async: async.Dataset
}