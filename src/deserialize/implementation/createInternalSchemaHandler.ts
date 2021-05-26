import * as astn from "astn"
import * as p from "pareto-20"
import { InternalSchemaError } from "../../API/SchemaErrors"

export function createInternalSchemaHandler<Result>(
    onSchemaError: (error: InternalSchemaError, range: astn.Range) => void,
    onObject: astn.OnObject<astn.ParserAnnotationData> | null,
    onSimpleValue: astn.OnSimpleValue<astn.ParserAnnotationData> | null,
    onEnd: () => p.IUnsafeValue<Result, null>
): astn.TextParserEventConsumer<Result, null> {
    return astn.createStackedParser(
        {
            onExists: {
                array: data => {
                    onSchemaError(["unexpected schema format", { found: ["array"] }], data.annotation.range)
                    return astn.createDummyArrayHandler()
                },
                object: onObject !== null
                    ? onObject
                    : data => {
                        onSchemaError(["unexpected schema format", { found: ["object"] }], data.annotation.range)
                        return astn.createDummyObjectHandler()
                    },
                simpleValue: onSimpleValue !== null
                    ? onSimpleValue
                    : data => {
                        onSchemaError(["unexpected schema format", { found: ["simple value"] }], data.annotation.range)
                        return p.value(false)
                    },
                taggedUnion: data => {
                    onSchemaError(["unexpected schema format", { found: ["tagged union"] }], data.annotation.range)
                    return {
                        option: (): astn.RequiredValueHandler<astn.ParserAnnotationData> => astn.createDummyRequiredValueHandler(),
                        missingOption: (): void => {
                            //
                        },
                        end: () => {
                            //
                        },
                    }
                },
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
