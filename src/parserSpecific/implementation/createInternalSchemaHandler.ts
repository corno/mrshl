import * as astncore from "astn-core"
import * as p from "pareto"
import { EmbeddedSchemaError } from "../interfaces"

export function createInternalSchemaHandler<Annotation, Result>(
    onSchemaError: (error: EmbeddedSchemaError, annotation: Annotation) => void,
    onObject: astncore.OnObject<Annotation, null, p.IValue<null>> | null,
    onString: astncore.OnSimpleString<Annotation, p.IValue<null>> | null,
    onEnd: () => p.IUnsafeValue<Result, null>
): astncore.ITreeBuilder<Annotation, Result, null> {
    return astncore.createStackedParser(
        {
            root: {
                exists: {
                    array: data => {
                        onSchemaError(["unexpected schema format", { found: ["array"] }], data.annotation)
                        return astncore.createDummyArrayHandler(() => p.value(null))
                    },
                    object: onObject !== null
                        ? onObject
                        : data => {
                            onSchemaError(["unexpected schema format", { found: ["object"] }], data.annotation)
                            return astncore.createDummyObjectHandler(() => p.value(null))
                        },
                    simpleString: onString !== null
                        ? onString
                        : data => {
                            onSchemaError(["unexpected schema format", { found: ["simple value"] }], data.annotation)
                            return p.value(null)
                        },
                    multilineString: data => {
                        onSchemaError(["unexpected schema format", { found: ["multiline string"] }], data.annotation)
                        return p.value(null)
                    },
                    taggedUnion: data => {
                        onSchemaError(["unexpected schema format", { found: ["tagged union"] }], data.annotation)
                        return {
                            option: () => astncore.createDummyRequiredValueHandler(() => p.value(null)),
                            missingOption: (): void => {
                                //
                            },
                            end: () => {
                                return p.value(null)
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
        () => astncore.createDummyValueHandler(() => p.value(null))
    )
}
