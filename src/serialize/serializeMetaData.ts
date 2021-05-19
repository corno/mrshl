/* eslint
    no-shadow: "off",
*/
import * as astn from "astn"
import * as syncAPI from "../syncAPI"
import * as md from "../types"
import * as g from "../generics"
import { InternalSchemaSpecification } from "../syncAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

class InDictionary<T> implements astn.IInDictionary<T> {
    private readonly properties: { [key: string]: T }
    constructor(properties: { [key: string]: T }) {
        this.properties = properties
    }
    isEmpty() {
        return Object.keys(this.properties).length === 0
    }
    map<R>(callback: (property: T, name: string) => R) {
        const keys = Object.keys(this.properties)
        const orderedKeys = keys.sort()
        return new InArray(orderedKeys.map(e => callback(this.properties[e], e)))
    }
}

class InArray<T> implements astn.IInArray<T> {
    private readonly elements: T[]
    constructor(elements: T[]) {
        this.elements = elements
    }
    isEmpty() {
        return this.elements.length === 0
    }
    map<R>(callback: (element: T) => R) {
        return new InArray(this.elements.map(e => callback(e)))
    }

    forEach(callback: (element: T) => void) {
        this.elements.forEach(e => callback(e))
    }
}

function createEmptyCommentData(): astn.SerializableCommentData {
    return {
        before: {
            comments: new InArray([]),
        },
        lineCommentAfter: null,
    }
}

function createType(propertyValues: { [Key: string]: [boolean, astn.SerializableValue] }): astn.SerializableValue {
    const properties: { [Key: string]: astn.SerializableProperty } = {}
    Object.keys(propertyValues).sort().forEach(propertyName => {
        const isDefault = propertyValues[propertyName][0]
        if (!isDefault) {
            properties[propertyName] = {
                commentData: createEmptyCommentData(),
                quote: "'",
                value: propertyValues[propertyName][1],
            }
        }
    })
    return {
        commentData: createEmptyCommentData(),
        type: ["object", {
            openCharacter: "(",
            closeCharacter: ")",
            commentData: createEmptyCommentData(),
            properties: new InDictionary(properties),
        }],
    }
}
function createDictionary<T>(entries: g.IReadonlyDictionary<T>, entryMapper: (entry: T) => astn.SerializableValue): astn.SerializableValue {
    return {
        commentData: createEmptyCommentData(),
        type: ["object", {
            openCharacter: "{",
            closeCharacter: "}",
            commentData: createEmptyCommentData(),
            properties: new InDictionary(entries.mapSorted(entry => {
                return {
                    commentData: createEmptyCommentData(),
                    quote: "\"",
                    value: entryMapper(entry),
                }
            })),
        }],
    }
}

function createReference<T>(reference: g.IReference<T>): astn.SerializableValue {
    return {
        commentData: createEmptyCommentData(),
        type: ["simple value", {
            quote: "'",
            value: reference.name,
        }],
    }
}
function createTaggedUnion(option: string, data: astn.SerializableValue): astn.SerializableValue {
    return {
        commentData: createEmptyCommentData(),
        type: ["tagged union", {
            quote: "'",
            option: option,
            commentData: createEmptyCommentData(),
            data: data,
        }],
    }
}

function createTextProperty(value: string, quoted = true): astn.SerializableValue {
    return {
        commentData: createEmptyCommentData(),
        type: ["simple value", {
            quote: quoted ? "\"" : null,
            value: value,
        }],
    }
}

function schemaPropertyIsDefault(prop: md.Property): boolean {
    let isDefault = true
    switch (prop.type[0]) {
        case "collection": {
            const $ = prop.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    isDefault = false

                    break
                }
                case "list": {
                    const $$ = $.type[1]
                    if (!schemaNodeIsDefault($$.node)) {
                        isDefault = false
                    }
                    break
                }
                default:
                    assertUnreachable($.type[0])
            }
            break
        }
        case "component": {
            const $ = prop.type[1]
            if (!schemaNodeIsDefault($.type.get().node)) {
                isDefault = false
            }
            break
        }
        case "state group": {
            const $ = prop.type[1]
            if ($["default state"].name !== "yes") {
                isDefault = false
            }
            if (!$.states.isEmpty()) {
                isDefault = false
            }
            break
        }
        case "value": {
            const $ = prop.type[1]

            if (!$.quoted) {
                isDefault = false
            }
            if ($["default value"] !== "") {
                isDefault = false
            }
            break
        }
        default:
            assertUnreachable(prop.type[0])
    }
    return isDefault
}

function schemaNodeIsDefault(node: md.Node): boolean {
    return node.properties.isEmpty()
}

function createSerializableValueFromSchemaNode(schemaNode: md.Node): astn.SerializableValue {
    const properties: { [key: string]: astn.SerializableProperty } = schemaNode.properties.mapSorted((entry, _key) => {
        return {
            commentData: createEmptyCommentData(),
            quote: "\"",
            value: createType({
                type: [schemaPropertyIsDefault(entry), ((): astn.SerializableValue => {
                    switch (entry.type[0]) {
                        case "collection": {
                            const $ = entry.type[1]

                            return createTaggedUnion("collection", createType({
                                type: [$.type[0] === "list" && schemaNodeIsDefault($.type[1].node), ((): astn.SerializableValue => {
                                    switch ($.type[0]) {
                                        case "dictionary": {
                                            const $$ = $.type[1]
                                            return createTaggedUnion("dictionary", createType({
                                                "key property": [$$["key property"].name === "name", createReference($$["key property"])],
                                                "node": [schemaNodeIsDefault($$.node), createSerializableValueFromSchemaNode($$.node)],
                                            }))
                                        }
                                        case "list": {
                                            const $$ = $.type[1]
                                            return createTaggedUnion("list", createType({
                                                node: [schemaNodeIsDefault($$.node), createSerializableValueFromSchemaNode($$.node)],
                                            }))
                                        }
                                        default:
                                            return assertUnreachable($.type[0])
                                    }
                                })()],
                            }))
                        }
                        case "component": {
                            const $ = entry.type[1]
                            return createTaggedUnion("component", createType({
                                type: [$.type.name === "", createReference($.type)],
                            }))
                        }
                        case "state group": {
                            const $ = entry.type[1]

                            return createTaggedUnion("state group", createType({
                                "default state": [$["default state"].name === "yes", createReference($["default state"])],
                                "states": [$.states.isEmpty(), createDictionary($.states, state => {
                                    return createType({
                                        node: [schemaNodeIsDefault(state.node), createSerializableValueFromSchemaNode(state.node)],
                                    })
                                })],
                            }))
                        }
                        case "value": {
                            const $ = entry.type[1]
                            return createTaggedUnion("value", createType({
                                "quoted": [$.quoted, createTextProperty($.quoted ? "true" : "false", false)],
                                "default value": [$["default value"] === "", createTextProperty($["default value"])],
                            }))
                        }
                        default:
                            return assertUnreachable(entry.type[0])
                    }
                })()],
            }),
        }
    })
    return {
        commentData: createEmptyCommentData(),
        type: ["object", {
            commentData: {
                before: {
                    comments: new InArray([]),
                },
                lineCommentAfter: null,
            },
            properties: new InDictionary({
                properties: {
                    commentData: createEmptyCommentData(),
                    quote: "'",
                    value: {
                        commentData: createEmptyCommentData(),
                        type: ["object", {
                            commentData: {
                                before: {
                                    comments: new InArray([]),
                                },
                                lineCommentAfter: null,
                            },
                            properties: new InDictionary(properties),
                            openCharacter: `{`,
                            closeCharacter: `}`,

                        }],
                    },
                },
            }),
            openCharacter: `(`,
            closeCharacter: `)`,

        }],
    }
}

export function serializeMetaData(
    internalSchemaSpecification: InternalSchemaSpecification,
    schema: md.Schema
): astn.SerializableValue | null {
    switch (internalSchemaSpecification[0]) {
        case syncAPI.InternalSchemaSpecificationType.Embedded: {

            return createType({
                "component types": [schema["component types"].isEmpty(), createDictionary(
                    schema["component types"],
                    componentType => {
                        return createType({
                            node: [schemaNodeIsDefault(componentType.node), createSerializableValueFromSchemaNode(componentType.node)],
                        })
                    }
                )],
                "root type": [schema["root type"].name === "root", createReference(schema["root type"])],
            })
        }
        case syncAPI.InternalSchemaSpecificationType.None: {
            return null
        }
        case syncAPI.InternalSchemaSpecificationType.Reference: {
            const $ = internalSchemaSpecification[1]
            return {
                commentData: createEmptyCommentData(),
                type: ["simple value", {
                    quote: `"`,
                    value: $.name,
                }],
            }
        }
        default:
            return assertUnreachable(internalSchemaSpecification[0])
    }
}