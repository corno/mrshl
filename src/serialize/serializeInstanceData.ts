import * as bc from "bass-clarinet"
import * as syncAPI from "../syncAPI"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

class InDictionary<T> implements bc.IInDictionary<T> {
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

class InArray<T> implements bc.IInArray<T> {
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

function createEmptyCommentData(): bc.SerializableCommentData {
    return {
        before: {
            comments: new InArray([]),
        },
        lineCommentAfter: null,
    }
}

function transformCommentData(comments: syncAPI.Comments): bc.SerializableCommentData {
    return {
        before: {
            comments: new InArray(comments.getComments().map(c => {
                return {
                    text: c.value,
                }
            })),
        },
        lineCommentAfter: null,
    }
}

function nodeIsDefault(node: syncAPI.Node): boolean {
    let foundNonDefault = false
    node.forEachProperty(prop => {
        if (!propertyIsDefault(prop)) {
            foundNonDefault = true
        }
    })
    return !foundNonDefault
}

function propertyIsDefault(property: syncAPI.Property): boolean {
    switch (property.type[0]) {
        case "component": {
            const $ = property.type[1]
            return nodeIsDefault($.node)
        }
        case "dictionary": {
            const $ = property.type[1]
            return $.isEmpty()
        }
        case "list": {
            const $ = property.type[1]
            return $.isEmpty()
        }
        case "state group": {
            const $ = property.type[1]
            if ($.getCurrentState().getStateKey() !== $.definition["default state"].name) {
                return false
            }
            return nodeIsDefault($.getCurrentState().node)
        }
        case "value": {
            const $ = property.type[1]
            return $.getValue() === $.definition["default value"]
        }
        default:
            return assertUnreachable(property.type[0])
    }
}

function transformProperty(prop: syncAPI.Property, compact: boolean): bc.SerializableValue {
    switch (prop.type[0]) {
        case "component": {
            const $ = prop.type[1]
            return {
                commentData: transformCommentData($.comments),
                type: transformNodeToValueType($.node, compact),
            }
        }
        case "dictionary": {
            const $ = prop.type[1]

            const entries: { [key: string]: bc.SerializableProperty } = {}

            $.forEachEntry((entry, key) => {
                entries[key] = {
                    commentData: transformCommentData(entry.comments),
                    quote: "\"",
                    value: serializeNode(entry.node, compact),
                }
            })
            return {
                commentData: transformCommentData($.comments),
                type: ["object", {
                    properties: new InDictionary(entries),
                    openCharacter: "{",
                    closeCharacter: "}",
                    commentData: createEmptyCommentData(),
                }],
            }
        }
        case "list": {
            const $ = prop.type[1]
            const elements: bc.SerializableValue[] = []
            $.forEachEntry(entry => {
                elements.push({
                    commentData: transformCommentData(entry.comments),
                    type: transformNodeToValueType(entry.node, compact),
                })
            })
            return {
                commentData: transformCommentData($.comments),
                type: ["array", {
                    elements: new InArray(elements),
                    openCharacter: "[",
                    closeCharacter: "]",
                    commentData: createEmptyCommentData(),
                }],
            }
        }
        case "state group": {
            const $ = prop.type[1]
            const currentState = $.getCurrentState()
            return {
                commentData: transformCommentData($.comments),
                type: ["tagged union", {
                    commentData: createEmptyCommentData(),
                    quote: "'",
                    option: currentState.getStateKey(),
                    data: serializeNode(currentState.node, compact),
                }],
            }
        }
        case "value": {
            const $ = prop.type[1]
            return {
                commentData: transformCommentData($.comments),
                type: ["simple value", {
                    quote: $.definition.quoted ? "\"" : null,
                    value: $.getValue(),
                }],
            }
        }
        default:
            return assertUnreachable(prop.type[0])
    }
}

function transformNodeToValueType(node: syncAPI.Node, compact: boolean): bc.SerializableValueType {
    if (compact) {
        const elements: bc.SerializableValue[] = []
        node.forEachProperty((prop, _key) => {
            elements.push(transformProperty(prop, compact))
        })
        return ["array", {
            commentData: createEmptyCommentData(),
            elements: new InArray(elements),
            openCharacter: `<`,
            closeCharacter: `>`,
        }]
    } else {
        const properties: { [key: string]: bc.SerializableProperty } = {}
        node.forEachProperty((prop, key) => {
            if (!propertyIsDefault(prop)) {

                if (!prop.isKeyProperty) {
                    properties[key] = {
                        commentData: createEmptyCommentData(),
                        quote: "'",
                        value: transformProperty(prop, compact),
                    }
                }
            }
        })
        return ["object", {
            commentData: createEmptyCommentData(),
            properties: new InDictionary(properties),
            openCharacter: `(`,
            closeCharacter: `)`,
        }]
    }
}

export function serializeNode(node: syncAPI.Node, compact: boolean): bc.SerializableValue {
    return {
        commentData: createEmptyCommentData(),
        type: transformNodeToValueType(node, compact),
    }
}