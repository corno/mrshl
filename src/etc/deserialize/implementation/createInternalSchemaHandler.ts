import * as astncore from "astn-core"
import * as p from "pareto-20"
import { InternalSchemaError } from "../../../interfaces/schemaPlugin/internalSchemaDerializationError"

export function createInternalSchemaHandler<Annotation, Result>(
    onSchemaError: (error: InternalSchemaError, annotation: Annotation) => void,
    onObject: astncore.OnObject<Annotation, null> | null,
    onString: astncore.OnString<Annotation> | null,
    onEnd: () => p.IUnsafeValue<Result, null>
): astncore.ITreeBuilder<Annotation, Result, null> {
    return astncore.createStackedParser(
        {
            root: {
                exists: {
                    array: data => {
                        onSchemaError(["unexpected schema format", { found: ["array"] }], data.annotation)
                        return astncore.createDummyArrayHandler()
                    },
                    object: onObject !== null
                        ? onObject
                        : data => {
                            onSchemaError(["unexpected schema format", { found: ["object"] }], data.annotation)
                            return astncore.createDummyObjectHandler()
                        },
                    string: onString !== null
                        ? onString
                        : data => {
                            onSchemaError(["unexpected schema format", { found: ["simple value"] }], data.annotation)
                            return p.value(false)
                        },
                    taggedUnion: data => {
                        onSchemaError(["unexpected schema format", { found: ["tagged union"] }], data.annotation)
                        return {
                            option: (): astncore.RequiredValueHandler<Annotation, null> => astncore.createDummyRequiredValueHandler(),
                            missingOption: (): void => {
                                //
                            },
                            end: () => {
                                //
                            },
                        }
                    },
                },
                missing: () => {
                    //
                },
            },
        },
        error => {
            onSchemaError(["stacked", error.type], error.annotation)
        },
        onEnd,
        astncore.createDummyValueHandler
    )
}
