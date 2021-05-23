import * as astn from "astn"
import * as p from "pareto-20"
import { InternalSchemaError } from "../../API/SchemaErrors"

export function createInternalSchemaHandler<Result>(
    onSchemaError: (error: InternalSchemaError, range: astn.Range) => void,
    onObject: astn.OnObject | null,
    onSimpleValue: astn.OnSimpleValue | null,
    onEnd: () => p.IUnsafeValue<Result, null>
): astn.ParserEventConsumer<Result, null> {
    return astn.createStackedDataSubscriber(
        {
            onValue: () => {
                return {
                    array: (range: astn.Range): astn.ArrayHandler => {
                        onSchemaError(["unexpected schema format", { found: ["array"] }], range)
                        return astn.createDummyArrayHandler()
                    },
                    object: onObject !== null
                        ? onObject
                        : (range: astn.Range): astn.ObjectHandler => {
                            onSchemaError(["unexpected schema format", { found: ["object"] }], range)
                            return astn.createDummyObjectHandler()
                        },
                    simpleValue: onSimpleValue !== null
                        ? onSimpleValue
                        : (range: astn.Range, _data: astn.SimpleValueData): p.IValue<boolean> => {
                            onSchemaError(["unexpected schema format", { found: ["simple value"] }], range)
                            return p.value(false)
                        },
                    taggedUnion: (range: astn.Range): astn.TaggedUnionHandler => {
                        onSchemaError(["unexpected schema format", { found: ["tagged union"] }], range)
                        return {
                            option: (): astn.RequiredValueHandler => astn.createDummyRequiredValueHandler(),
                            missingOption: (): void => {
                                //
                            },
                            end: () => {
                                //
                            },
                        }
                    },
                }
            },
            onMissing: () => {
                //
            },
        },
        (error, range) => {
            onSchemaError(["stacked", error], range)
        },
        onEnd
    )
}
