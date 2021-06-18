import * as p from "pareto"
import * as p20 from "pareto-20"
import * as astncore from "astn-core"
//import { serializeNode } from "./serializeInstanceData"
//import { serializeMetaData } from "./serializeMetaData"
import { RootImp } from "../Root"
import { InternalSchemaSpecification, InternalSchemaSpecificationType } from "../../../../etc/interfaces/InternalSchemaSpecification"
import { serializeMetaData } from "./serializeMetaData"
import { SerializeOut, serializeRoot } from "./serializeInstanceData"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function serialize(
    root: RootImp,
    internalSchemaSpecification: InternalSchemaSpecification,
    style: ["verbose"] | ["shorthand"],
    writer: (str: string) => void,
): p.IValue<null> {
    // const rootComments = dataset.rootComments.getComments()
    // const allComments = dataset.documentComments.getComments().concat(rootComments)

    const newline = "\r\n"

    const formatter = astncore.createASTNNormalizer<null, null>("    ", newline)

    function serializeEvents(events: astncore.TreeBuilderEvent<null>[]) {

        const treeBuilder = astncore.createStackedParser<null, null, null>(
            astncore.createDecoratedTree(
                formatter.schemaFormatter,
                astncore.createTreeConcatenator(
                    writer,
                    () => p.value(null)
                ),
            ),
            _error => {
                //
            },
            () => {
                writer(formatter.onAfterSchema())
                //onEnd
                //no need to return an value, we're only here for the side effects, so return 'null'
                return p.success(null)
            },
            () => astncore.createDummyValueHandler(() => p.value(null)),
        )
        return p20.createArray(events).streamify().tryToConsume(null, treeBuilder).catch(error => {
            console.log(error)
            return p.value(null)
        })

    }


    return ((): p.IValue<null> => {
        switch (internalSchemaSpecification[0]) {
            case InternalSchemaSpecificationType.Embedded: {
                writer(`! `)
                return serializeEvents(serializeMetaData(
                    root.schema,
                )).mapResult(() => {
                    //writer(`${newline}`)
                    return p.value(null)
                })
            }
            case InternalSchemaSpecificationType.None: {
                return p.value(null)
            }
            case InternalSchemaSpecificationType.Reference: {
                const $ = internalSchemaSpecification[1]
                writer(`! ${astncore.createSerializedQuotedString($.name)}${newline}`)
                return p.value(null)
            }
            default:
                return assertUnreachable(internalSchemaSpecification[0])
        }

    })().mapResult(() => {
        const events: astncore.TreeBuilderEvent<null>[] = []

        function createOut(): SerializeOut {
            return {
                sendBlock: (eventpair, callback) => {
                    events.push({
                        type: eventpair.open,
                        annotation: null,
                    })
                    callback(createOut())
                    events.push({
                        type: eventpair.close,
                        annotation: null,
                    })
                },
                sendEvent: event => {
                    events.push({
                        type: event,
                        annotation: null,
                    })
                },
            }
        }
        serializeRoot(
            root,
            style,
            createOut(),
        )
        return serializeEvents(events)
    })
}
