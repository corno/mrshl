import * as bc from "bass-clarinet-typed"
import * as p from "pareto-20"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export type InternalSchemaError =
    | ["unexpected schema format", {
        found:
        | ["array"]
        | ["object"]
        | ["simple value"]
        | ["tagged union"]
    }]
    | ["stacked", bc.StackedDataError]


export function printInternalSchemaError(error: InternalSchemaError): string {
    switch (error[0]) {
        case "stacked": {
            const $$$ = error[1]
            return bc.printStackedDataError($$$)
        }
        case "unexpected schema format": {
            const $$$ = error[1]
            switch ($$$.found[0]) {
                case "array": {

                    return "unexpected array as schema"
                }
                case "simple value": {
                    return "unexpected simple value as schema"
                }
                case "tagged union": {
                    return "unexpected tagged union as schema"
                }
                case "object": {
                    return "unexpected object as schema"
                }
                default:
                    return assertUnreachable($$$.found[0])
            }
        }
        default:
            return assertUnreachable(error[0])
    }
}

export function createInternalSchemaHandler<Result>(
    onSchemaError: (error: InternalSchemaError, range: bc.Range) => void,
    onObject: bc.OnObject | null,
    onSimpleValue: bc.OnSimpleValue | null,
    onEnd: (contextData: bc.ContextData) => p.IUnsafeValue<Result, null>
): bc.ParserEventConsumer<Result, null> {

    return bc.createStackedDataSubscriber(
        {
            onValue: () => {
                return {
                    array: (range: bc.Range): bc.ArrayHandler => {
                        onSchemaError(["unexpected schema format", { found: ["array"] }], range)
                        return bc.createDummyArrayHandler()
                    },
                    object: onObject !== null
                        ? onObject
                        : (range: bc.Range): bc.ObjectHandler => {
                            onSchemaError(["unexpected schema format", { found: ["object"] }], range)
                            return bc.createDummyObjectHandler()
                        },
                    simpleValue: onSimpleValue !== null
                        ? onSimpleValue
                        : (range: bc.Range, _data: bc.SimpleValueData): p.IValue<boolean> => {
                            onSchemaError(["unexpected schema format", { found: ["simple value"] }], range)
                            return p.value(false)
                        },
                    taggedUnion: (range: bc.Range): bc.TaggedUnionHandler => {
                        onSchemaError(["unexpected schema format", { found: ["tagged union"] }], range)
                        return {
                            option: (): bc.RequiredValueHandler => bc.createDummyRequiredValueHandler(),
                            missingOption: (): void => {
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
