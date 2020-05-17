import * as i from "../interfaces"
import * as t from "../types"

function getState<RT>(value: i.ValueAPI, source: i.Deserializer, callback: (key: string, object: i.ObjectAPI) => RT) {
    const propArray = source.castToArray(value)
    source.assertArrayLength(propArray, 2)
    const first = source.castToString(source.getElement(propArray, 0))
    const second = source.castToObject(source.getElement(propArray, 1))
    return callback(first, second)
}

function deserializeMetaNode(value: i.ValueAPI, source: i.Deserializer, componentTypes: t.ComponentTypes): t.Node {
    const sourceObj = source.castToObject(value)
    return {
        properties: source.mapObject(source.castToObject(source.getEntry(sourceObj, "properties")), prop => {
            return getState(source.getEntry(source.castToObject(prop), "type"), source, (propType, property) => {
                switch (propType) {
                    case "collection": {
                        return {
                            type: ["collection", {
                                node: deserializeMetaNode(source.getEntry(property, "node"), source, componentTypes),
                            }],
                        }
                    }
                    case "component": {
                        const ctName = source.castToString(source.getEntry(property, "type"))
                        // the component type is possibly not yet deserialized

                        //const compType = componentTypes[ctName]
                        // if (compType === undefined) {
                        //     console.error("component type does not exist:", ctName)
                        //     console.error(componentTypes)
                        //     throw new Error("comp type does not exist")
                        // }
                        return {
                            type: ["component", {
                                type: ctName,
                            }],
                        }
                    }
                    case "state group": {
                        return {
                            type: ["state group", {
                                states: source.mapObject(source.castToObject(source.getEntry(property, "states")), st => {
                                    return {
                                        node: deserializeMetaNode(source.getEntry(source.castToObject(st), "node"), source, componentTypes),
                                    }
                                }),
                            }],
                        }
                    }
                    case "value": {
                        return {
                            type: ["value", {}],
                        }
                    }
                    default:
                        console.error("unknown 'property type' state", propType)
                        throw new Error("unknown 'property type' state")
                }

            })
        }),
    }
}

export function deserializeMetaData(data: string, source: i.Deserializer) {
    const value = JSON.parse(data)
    const schemaSrc = source.castToObject(value)
    const componentTypes: t.ComponentTypes = {}
    source.mapObject(source.castToObject(source.getEntry(schemaSrc, "component types")), (entry, key) => {
        componentTypes[key] = {
            node: deserializeMetaNode(source.getEntry(source.castToObject(entry), "node"), source, componentTypes),
        }
    })
    const schema: t.Schema = {
        "component types": componentTypes,
        "root": deserializeMetaNode(source.getEntry(schemaSrc, "root"), source, componentTypes),
    }
    return schema
}
