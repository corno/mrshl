import * as bc from "bass-clarinet"
import { NodeBuilder } from "./api"
import { RegisterSnippetsGenerators } from "./registerSnippetGenerators"
import { createNodeDeserializer } from "./createNodeDeserializer"
import { SchemaAndNodeValidator } from "../deserializeSchema"

function createDummyPropertyHandler(
    _key: string,
    propertyData: bc.PropertyData,
    _preData: bc.PreData,
    registerSnippetGenerators: RegisterSnippetsGenerators,
): bc.ValueHandler {
    registerSnippetGenerators(propertyData.keyRange, null, null)
    return createDummyValueHandler(registerSnippetGenerators)
}

function createDummyValueHandler(registerSnippetGenerators: RegisterSnippetsGenerators): bc.ValueHandler {
    return {
        array: openData => {
            return createDummyArrayHandler(openData.start, registerSnippetGenerators)
        },
        object: openData => {
            return createDummyObjectHandler(openData.start, registerSnippetGenerators)
        },
        simpleValue: (_value, stringData) => {
            registerSnippetGenerators(stringData.range, null, null)
        },
        taggedUnion: (_option, tuData, _tuComments) => {
            registerSnippetGenerators(tuData.startRange, null, null)
            registerSnippetGenerators(tuData.optionRange, null, null)
            return createDummyValueHandler(registerSnippetGenerators)
        },
    }
}

function createDummyArrayHandler(beginRange: bc.Range, registerSnippetGenerators: RegisterSnippetsGenerators): bc.ArrayHandler {
    registerSnippetGenerators(beginRange, null, null)
    return {
        element: () => createDummyValueHandler(registerSnippetGenerators),
        end: endData => {
            registerSnippetGenerators(endData.range, null, null)
        },
    }
}

function createDummyObjectHandler(beginRange: bc.Range, registerSnippetGenerators: RegisterSnippetsGenerators): bc.ObjectHandler {
    registerSnippetGenerators(beginRange, null, null)
    return {
        property: (_key, keyData) => {
            registerSnippetGenerators(keyData.keyRange, null, null)
            return createDummyValueHandler(registerSnippetGenerators)
        },
        end: endData => {
            registerSnippetGenerators(endData.range, null, null)
        },
    }
}


export function attachDeserializer(
    parser: bc.Parser,
    metaData: SchemaAndNodeValidator,
    onError: bc.IssueHandler,
    onWarning: bc.IssueHandler,
    nodeBuilder: NodeBuilder,
    isCompact: boolean,
    registerSnippetGenerators: RegisterSnippetsGenerators,
    onEnd: () => void,
) {
    const context = new bc.ExpectContext(
        onError,
        onWarning,
        openData => createDummyArrayHandler(openData.start, registerSnippetGenerators),
        openData => createDummyObjectHandler(openData.start, registerSnippetGenerators),
        (key, propertyData, preData) => createDummyPropertyHandler(key, propertyData, preData, registerSnippetGenerators),
        () => createDummyValueHandler(registerSnippetGenerators),
    )

    parser.ondata.subscribe(bc.createStackedDataSubscriber(
        createNodeDeserializer(context, metaData.schema["root type"].get().node, nodeBuilder, metaData.nodeValidator, isCompact, registerSnippetGenerators),
        error => {
            if (error.context[0] === "range") {
                onError(error.message, error.context[1])
            } else {
                onError(error.message, { start: error.context[1], end: error.context[1] })
            }
        },
        () => {
            onEnd()
        }
    ))
}
