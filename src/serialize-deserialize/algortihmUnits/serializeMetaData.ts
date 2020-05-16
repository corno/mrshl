import * as d from "../../definition/index"
import * as i from "../interfaces"
import * as t from "../types"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}


function buildMetaNode(definition: d.Node, componentTypes: t.ComponentTypes): t.Node {
    const un: t.Node = {
        properties: {},
    }
    definition.properties.forEach((prop, propKey) => {
        switch (prop.type[0]) {
            case "collection": {
                //const $ = prop.type[1]
                un.properties[propKey] = {
                    type: ["collection", {
                        "has instances": ["no", {}],
                    }],
                }
                break
            }
            case "component": {
                const $ = prop.type[1]
                if (componentTypes[$.type.name] === undefined) {
                    componentTypes[$.type.name] = {
                        node: buildMetaNode($.type.get().node, componentTypes),
                    }
                }
                un.properties[propKey] = {
                    type: ["component", {
                        type: $.type.name,
                    }],
                }

                break
            }
            case "state group": {
                //const $ = prop.type[1]
                un.properties[propKey] = {
                    type: ["state group", {
                        states: {},
                    }],
                }
                break
            }
            case "value": {
                //const $ = prop.type[1]
                un.properties[propKey] = { type: ["value", {}] }
                break
            }
            default:
                return assertUnreachable(prop.type[0])
        }
    })
    return un
}

function markNodeUsage(definition: d.Node, node: i.SerializableNode, usedNode: t.Node, componentTypes: t.ComponentTypes) {
    definition.properties.forEach((propertyDefinition, propertyKey) => {
        const usedProperty = usedNode.properties[propertyKey]
        switch (propertyDefinition.type[0]) {
            case "component": {
                const $ = propertyDefinition.type[1]
                markNodeUsage($.type.get().node, node.getComponent(propertyKey).node, componentTypes[$.type.name].node, componentTypes)

                break
            }
            case "collection": {
                const $ = propertyDefinition.type[1]
                if (usedProperty.type[0] !== "collection") {
                    throw new Error("FIXME")
                }
                const usedCollection = usedProperty.type[1]
                switch ($.type[0]) {
                    case "dictionary": {
                        node.getDictionary(propertyKey).forEachEntry(entry => {
                            if (usedCollection["has instances"][0] === "no") {
                                usedCollection["has instances"] = ["yes", {
                                    node: buildMetaNode($.node, componentTypes),
                                }]
                            }
                            markNodeUsage($.node, entry.node, usedCollection["has instances"][1].node, componentTypes)
                        })

                        break
                    }
                    case "list": {
                        node.getList(propertyKey).forEachEntryL(entry => {
                            if (usedCollection["has instances"][0] === "no") {
                                usedCollection["has instances"] = ["yes", {
                                    node: buildMetaNode($.node, componentTypes),
                                }]
                            }
                            markNodeUsage($.node, entry.node, usedCollection["has instances"][1].node, componentTypes)
                        })
                        break
                    }
                    default:
                        assertUnreachable($.type[0])
                }
                break
            }
            case "state group": {
                const $ = propertyDefinition.type[1]
                const sg = node.getStateGroup(propertyKey)
                if (usedProperty.type[0] !== "state group") {
                    throw new Error("FIXME")
                }
                const usedSg = usedProperty.type[1]
                const stateKey = sg.getCurrentState().getStateKey()
                if (usedSg.states[stateKey] === undefined) {
                    usedSg.states[stateKey] = {
                        node: buildMetaNode($.states.get(sg.getCurrentState().getStateKey()).node, componentTypes),
                    }
                }
                markNodeUsage($.states.get(sg.getCurrentState().getStateKey()).node, sg.getCurrentState().node, usedSg.states[stateKey].node, componentTypes)
                break
            }
            case "value": {
                break
            }
            default:
                return assertUnreachable(propertyDefinition.type[0])
        }
    })
}

function buildMetaData(definition: d.Node, rootNode: i.SerializableNode) {
    // rootNode.definition.properties((p, propertyKey) => {
    //     rootmd.Node.properties[propertyKey] = {
    //         type: [ "collection", {
    //             node: [
    //                 type: [""]
    //             ]
    //         }]
    //     }
    // })

    const ct: t.ComponentTypes = {}
    const usedSchema: t.Schema = {
        "component types": ct,
        "root": buildMetaNode(definition, ct),
    }
    markNodeUsage(definition, rootNode, usedSchema.root, ct)
    return usedSchema
}

export function serializeMetaData(definition: d.Node, rootNode: i.SerializableNode) {
    const schema = buildMetaData(definition, rootNode)
    return JSON.stringify(schema)
}
