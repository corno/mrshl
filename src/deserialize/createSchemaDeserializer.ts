import * as bc from "bass-clarinet"
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
    | [`missing schema schema definition`]
    | [`parsing`, bc.ParsingError]
    | [`schema processing`, InternalSchemaDeserializationError]


export function printSchemaSchemaError($$: SchemaSchemaError): string {
    switch ($$[0]) {
        case "missing schema schema definition": {
            //const $$$ = $$[1]
            return `missing schema schema definition`
        }
        case "parsing": {
            const $$$ = $$[1]
            return bc.printParsingError($$$)
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
    onError: (error: SchemaSchemaError, range: bc.Range) => void,
): p.IStreamConsumer<string, null, SchemaAndSideEffects, null> {
    let foundError = false

    let schemaDefinitionFound = false
    let schemaProcessor: null | CreateSchemaAndSideEffectsBuilderFunction = null
    function onSchemaError(error: SchemaSchemaError, range: bc.Range) {
        onError(error, range)
        foundError = true
    }

    //console.log("SCHEMA DESER")
    const schemaTok = bc.createParserStack(

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
                    return p.result(false)
                },
                () => {
                    //ignore end commends
                    return p.success<null, null>(null)
                }
            )
        },
        (_compact: bc.Range | null, location: bc.Location): bc.ParserEventConsumer<SchemaAndSideEffects, null> => {
            if (!schemaDefinitionFound) {
                //console.error("missing schema schema types")
                onSchemaError([`missing schema schema definition`], bc.createRangeFromSingleLocation(location))
                return {
                    onData: () => {
                        //
                        return p.result(false) //FIXME should be 'true', to abort
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
                            return p.result(true)
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

