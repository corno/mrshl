import * as p from "pareto"
import * as p20 from "pareto-20"
import * as astncore from "astn-core"
//import { serializeNode } from "./serializeInstanceData"
//import { serializeMetaData } from "./serializeMetaData"
import { RootImp } from "../Root"
import { InternalSchemaSpecification, InternalSchemaSpecificationType } from "../../../../etc/interfaces/InternalSchemaSpecification"
import { serializeMetaData } from "./serializeMetaData"
import { serializeRoot } from "./serializeInstanceData"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function serialize(
    root: RootImp,
    internalSchemaSpecification: InternalSchemaSpecification,
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
                astncore.createTreeConcatenator(writer),
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
            astncore.createDummyValueHandler,
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
        return serializeEvents(serializeRoot(root))
    })
}
