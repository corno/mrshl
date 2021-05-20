import * as astn from "astn"
import * as p from "pareto"
import { schemas, CreateSchemaAndSideEffectsBuilderFunction, SchemaAndSideEffects, InternalSchemaDeserializationError, printInternalSchemaDeserializationError } from "../schemas"
import { createInternalSchemaHandler, printInternalSchemaError, InternalSchemaError } from "../createInternalSchemaHandler"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export type SchemaSchemaError =
    | ["internal schema", InternalSchemaError]
    | ["unknown schema schema", {
        name: string
    }]
    | ["missing schema schema definition"]
    | ["parsing", astn.ParsingError]
    | ["schema processing", InternalSchemaDeserializationError]


export function printSchemaSchemaError($$: SchemaSchemaError): string {
    switch ($$[0]) {
        case "missing schema schema definition": {
            //const $$$ = $$[1]
            return `missing schema schema definition`
        }
        case "parsing": {
            const $$$ = $$[1]
            return astn.printParsingError($$$)
        }
        case "schema processing": {
            const $$$ = $$[1]
            return printInternalSchemaDeserializationError($$$)
        }
        case "internal schema": {
            const $$$ = $$[1]
            return printInternalSchemaError($$$)
        }
        case "unknown schema schema": {
            //const $$$ = $$[1]
            return `unknown schema schema`
        }
        default:
            return assertUnreachable($$[0])
    }
}

export function createSchemaDeserializer(
    onError: (error: SchemaSchemaError, range: astn.Range) => void,
): p.IUnsafeStreamConsumer<string, null, SchemaAndSideEffects, null> {
    let foundError = false

    let schemaDefinitionFound = false
    let schemaProcessor: null | CreateSchemaAndSideEffectsBuilderFunction = null
    function onSchemaError(error: SchemaSchemaError, range: astn.Range) {
        onError(error, range)
        foundError = true
    }

    //console.log("SCHEMA DESER")
    const schemaTok = astn.createParserStack(

        () => {
            schemaDefinitionFound = true
            return createInternalSchemaHandler(
                (error, range) => {
                    onSchemaError(["internal schema", error], range)
                },
                null,
                (range, svData) => {
                    const createSchemaFunc = schemas[svData.value]
                    if (createSchemaFunc === undefined) {
                        console.error(`unknown schema schema '${svData.value},`)
                        onSchemaError(["unknown schema schema", { name: svData.value }], range)
                    } else {
                        schemaProcessor = createSchemaFunc
                    }
                    return p.value(false)
                },
                () => {
                    //ignore end commends
                    return p.success<null, null>(null)
                }
            )
        },
        (location: astn.Location): astn.ParserEventConsumer<SchemaAndSideEffects, null> => {
            if (!schemaDefinitionFound) {
                //console.error("missing schema schema types")
                onSchemaError(["missing schema schema definition"], astn.createRangeFromSingleLocation(location))
                return {
                    onData: () => {
                        //
                        return p.value(false) //FIXME should be 'true', to abort
                    },
                    onEnd: () => {
                        return p.error(null)
                    },
                }
            } else {
                if (schemaProcessor === null) {
                    if (!foundError) {
                        throw new Error("UNEXPECTED: SCHEMA PROCESSOR NOT SUBSCRIBED AND NO ERRORS")
                    }
                    return {
                        onData: () => {
                            //
                            return p.value(true)
                        },
                        onEnd: () => {
                            return p.error(null)
                        },
                    }
                } else {
                    return schemaProcessor(
                        (error, range) => {
                            onError(["schema processing", error], range)
                        }
                    )
                }
            }
        },
        (error, range) => {
            onSchemaError(["parsing", error], range)
        }
    )

    //attach the schema schema deserializer
    return schemaTok
}

