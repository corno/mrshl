import * as fs from "fs"
import * as path from "path"
import * as p from "pareto-20"

export function readSchemaFileFromFileSystem(
	dir: string,
	schemaFileName: string,
) {
	return p.wrapUnsafeFunction<string | null, string>((onError, onSuccess) => {
		fs.promises.readFile(
			path.join(dir, schemaFileName), { encoding: "utf-8" }
		).then(content => {
			onSuccess(content)
		}).catch((err: NodeJS.ErrnoException) => {
			if (err.code === "ENOENT") {
				//there is no schema file
				onSuccess(null)
			} else {
				onError(err.message)
			}
		})
	})
}