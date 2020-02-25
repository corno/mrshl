import * as bc from "bass-clarinet"
import * as md from "../internalSchema"
import { NodeBuilder } from "./api"
import { createNodeDeserializer } from "./createNodeDeserializer"

export function createDeserializer(metaData: md.Schema, onError: bc.IssueHandler, onWarning: bc.IssueHandler, nodeBuilder: NodeBuilder, isCompact: boolean): bc.DataSubscriber {
    const context = new bc.ExpectContext(onError, onWarning)

    return bc.createStackedDataSubscriber(
        createNodeDeserializer(context, metaData["root type"].get().node, nodeBuilder, isCompact),
        error => {
            if (error.context[0] === "range") {
                onError(error.message, error.context[1])
            } else {
                onError(error.message, { start: error.context[1], end: error.context[1]})
            }
        },
        () => {
            //ignoreEndComments
        }
    )
}
