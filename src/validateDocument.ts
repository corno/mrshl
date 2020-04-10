import * as bc from "bass-clarinet"
import {  RegisterSnippetsGenerators, NodeBuilder } from "./deserialize"
import { SchemaAndNodeBuilderPair } from "./processDocument"
import { Schema } from "./metaDataSchema"

import { processDocument, ResolveSchemaReference } from "./processDocument"
import { createNodeDeserializer } from "./deserialize"

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


function attachInstanceDeserializer(
    parser: bc.Parser,
    schema: Schema,
    nodeBuilder: NodeBuilder,
    onError: bc.IssueHandler,
    onWarning: bc.IssueHandler,
    isCompact: boolean,
    registerSnippetGenerators: RegisterSnippetsGenerators,
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
        createNodeDeserializer(context, schema["root type"].get().node, nodeBuilder, isCompact, registerSnippetGenerators),
        error => {
            if (error.context[0] === "range") {
                onError(error.message, error.context[1])
            } else {
                onError(error.message, { start: error.context[1], end: error.context[1] })
            }
        },
        () => {
        }
    ))
}

/**
 * this function returns a Promise<void> and the promise is resolved when the validation has been completed
 */
export function validateDocument(
    document: string,
    externalSchema: SchemaAndNodeBuilderPair | null,
    schemaReferenceResolver: ResolveSchemaReference,
    onError: (message: string, range: bc.Range) => void,
    onWarning: (message: string, range: bc.Range) => void,
    registerSnippetGenerators: RegisterSnippetsGenerators,
): Promise<void> {
    return processDocument(
        document,
        externalSchema,
        schemaReferenceResolver,
        onError,
        onWarning,
        (
            parser,
            schema,
            nodeBuilder,
            isCompact,
        ) => {
            attachInstanceDeserializer(
                parser,
                schema,
                nodeBuilder,
                onError,
                onWarning,
                isCompact,
                registerSnippetGenerators,
            )
        }
    )
}
