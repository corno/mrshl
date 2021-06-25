import * as astncore from "astn-core"
import * as sideEffectAPI from "../interfaces/streamingValidationAPI"
import * as id from "../interfaces/buildAPI/IDataset"
import { createNodeDeserializer, OnError, wrap } from "./shared"

export function createDatasetDeserializer<TokenAnnotation, NonTokenAnnotation, ReturnType>(
    dataset: id.IDataset,
    sideEffectsHandlers: sideEffectAPI.ValueHandler<TokenAnnotation>[],
    onError: OnError<TokenAnnotation>,
    createReturnValue: () => ReturnType
): astncore.TreeHandler<TokenAnnotation, NonTokenAnnotation, ReturnType> {

    return {
        root: wrap(
            createNodeDeserializer(
                dataset.schema["root type"].get().node,
                dataset.root,
                sideEffectsHandlers,
                onError,
                () => {
                    //
                },
                dataset.rootComments,
                createReturnValue,
            ),
        ),
    }
}
