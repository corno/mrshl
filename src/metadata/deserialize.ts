/* eslint
    quote-props: "off",

*/
import * as bc from "bass-clarinet"
import * as g from "./generics"
import * as t from "./types"

function assertExists<T>(v: T | null) {
    if (v === null) {
        throw new Error("did not exist")
    }
    return v
}

function deserializeMetaNode(context: bc.IssueContext, componentTypes: g.IReadonlyDictionary<t.ComponentType>, callback: (node: t.Node) => void): bc.ValueHandler {
    const properties = new g.Dictionary<t.Property>({})
    return context.expectType(
        {
            "properties": context.expectDictionary(
                key => {
                    let targetPropertyType: t.PropertyType | null = null
                    return context.expectType(
                        {
                            "type": context.expectTaggedUnionOrArraySurrogate(propertyType => {
                                switch (propertyType) {
                                    case "collection": {
                                        let targetCollectionType: t.CollectionType | null = null
                                        return context.expectType(
                                            {
                                                "type": context.expectTaggedUnionOrArraySurrogate(sourceCollectionType => {
                                                    switch (sourceCollectionType) {
                                                        case "dictionary": {
                                                            let targetHasInstances: t.DictionaryHasInstances | null = null
                                                            return context.expectType(
                                                                {
                                                                    "has instances": context.expectTaggedUnionOrArraySurrogate(sourceHasInstances => {
                                                                        switch (sourceHasInstances) {
                                                                            case "yes": {
                                                                                let targetNode: t.Node | null = null
                                                                                let targetKeyProperty: string | null = null
                                                                                let targetKeyPropertyRange: bc.Range | null = null
                                                                                return context.expectType(
                                                                                    {
                                                                                        "node": deserializeMetaNode(context, componentTypes, node => targetNode = node),
                                                                                        "key property": context.expectString((sourceKeyProperty, range) => {
                                                                                            targetKeyProperty = sourceKeyProperty
                                                                                            targetKeyPropertyRange = range
                                                                                        }),
                                                                                    },
                                                                                    () => {
                                                                                        const assertedTargetNode = assertExists(targetNode)
                                                                                        const assertedTargetKeyProperty = assertExists(targetKeyProperty)
                                                                                        targetHasInstances = ["yes", {
                                                                                            "node": assertedTargetNode,
                                                                                            "key property": g.createReference(
                                                                                                assertedTargetKeyProperty,
                                                                                                () => assertedTargetNode.properties.get(assertedTargetKeyProperty, () => {
                                                                                                    throw new Error(
                                                                                                        `key property '${assertedTargetKeyProperty}' not found ` +
                                                                                                        ` @ ${bc.printRange(assertExists(targetKeyPropertyRange))}`
                                                                                                    )
                                                                                                })
                                                                                            ),
                                                                                        }]
                                                                                    }
                                                                                )
                                                                            }
                                                                            case "no": {
                                                                                targetHasInstances = ["no", {}]
                                                                                return context.expectType({}, () => {
                                                                                    //
                                                                                })
                                                                            }
                                                                            default:
                                                                                throw new Error(`uncontext.expected has instances type ${sourceHasInstances}`)
                                                                        }
                                                                    }),
                                                                },
                                                                () => {
                                                                    targetCollectionType = ["dictionary", {
                                                                        "has instances": assertExists(targetHasInstances),
                                                                    }]
                                                                }
                                                            )
                                                        }
                                                        case "list": {
                                                            let targetHasInstances: t.ListHasInstances | null = null
                                                            return context.expectType(
                                                                {
                                                                    "has instances": context.expectTaggedUnionOrArraySurrogate(sourceHasInstances => {
                                                                        switch (sourceHasInstances) {
                                                                            case "yes": {
                                                                                let targetNode: t.Node | null = null
                                                                                return context.expectType(
                                                                                    {
                                                                                        "node": deserializeMetaNode(context, componentTypes, node => targetNode = node),
                                                                                    },
                                                                                    () => {

                                                                                        targetHasInstances = ["yes", {
                                                                                            node: assertExists(targetNode),
                                                                                        }]
                                                                                    },
                                                                                )
                                                                            }
                                                                            case "no": {
                                                                                targetHasInstances = ["no", {}]
                                                                                return context.expectType({}, () => {
                                                                                    //
                                                                                })
                                                                            }
                                                                            default:
                                                                                throw new Error(`uncontext.expected has instances type ${sourceHasInstances}`)
                                                                        }
                                                                    }),
                                                                },
                                                                () => {
                                                                    targetCollectionType = ["list", {
                                                                        "has instances": assertExists(targetHasInstances),
                                                                    }]
                                                                },
                                                            )
                                                        }
                                                        default:
                                                            throw new Error(`uncontext.expected collection type ${sourceCollectionType}`)
                                                    }
                                                }),
                                            },
                                            () => {
                                                targetPropertyType = ["collection", {
                                                    "type": assertExists(targetCollectionType),
                                                }]
                                            },
                                        )

                                    }
                                    case "component": {
                                        let targetComponentTypeName: string | null = null
                                        let targetComponentTypeNameRange: bc.Range | null = null
                                        return context.expectType(
                                            {
                                                "type": context.expectString((sourceComponentTypeName, range) => {
                                                    targetComponentTypeName = sourceComponentTypeName
                                                    targetComponentTypeNameRange = range
                                                }),
                                            },
                                            () => {
                                                const assertedTargetComponentTypeName = assertExists(targetComponentTypeName)
                                                targetPropertyType = ["component", {
                                                    "type": g.createReference(
                                                        assertedTargetComponentTypeName,
                                                        () => componentTypes.get(assertedTargetComponentTypeName, () => {
                                                            throw new Error(
                                                                `component type '${assertedTargetComponentTypeName}' not found` +
                                                                ` @ ${bc.printRange(assertExists(targetComponentTypeNameRange))}`
                                                            )
                                                        }),
                                                    ),
                                                }]
                                            },
                                        )
                                    }
                                    case "state group": {
                                        const states = new g.Dictionary<t.State>({})
                                        return context.expectType(
                                            {
                                                "states": context.expectDictionary(stateKey => {
                                                    let targetNode: t.Node | null = null
                                                    return context.expectType(
                                                        {
                                                            "node": deserializeMetaNode(context, componentTypes, node => targetNode = node),
                                                        },
                                                        () => {
                                                            states.add(stateKey, {
                                                                node: assertExists(targetNode),
                                                            })
                                                        },
                                                    )
                                                }),
                                            },
                                            () => {
                                                targetPropertyType = ["state group", {
                                                    "states": states,
                                                }]
                                            },
                                        )
                                    }
                                    case "value": {
                                        let targetValueType: t.ValueType | null = null
                                        return context.expectType(
                                            {
                                                "type": context.expectTaggedUnionOrArraySurrogate(sourceValueType => {
                                                    switch (sourceValueType) {
                                                        case "number": {
                                                            targetValueType = ["number", {}]
                                                            return context.expectType({}, () => {
                                                                //
                                                            })
                                                        }
                                                        case "text": {
                                                            targetValueType = ["string", {}]
                                                            return context.expectType({}, () => {
                                                                //
                                                            })
                                                        }
                                                        default:
                                                            throw new Error(`uncontext.expected value type ${sourceValueType}`)
                                                    }
                                                }),
                                            },
                                            () => {
                                                targetPropertyType = ["value", {
                                                    "type": assertExists(targetValueType),
                                                }]
                                            },
                                        )
                                    }
                                    default:
                                        throw new Error(`uncontext.expected property type ${propertyType}`)
                                }
                            }),
                        },
                        () => {
                            properties.add(key, {
                                type: assertExists(targetPropertyType),
                            })
                        }
                    )
                }
            ),
        },
        () => {
            callback({ properties: properties })
        }
    )
}

export function createDeserializer(callback: (metaData: t.Schema) => void): bc.OnObject {


    const componentTypes = new g.Dictionary<t.ComponentType>({})
    let rootName: string | null = null
    let rootNameRange: bc.Range | null = null

    const context = new bc.IssueContext(null, null)

    return context.createTypeHandler(
        {
            "component types": context.expectDictionary(
                key => {
                    let targetNode: t.Node | null = null
                    return context.expectType(
                        {
                            "node": deserializeMetaNode(context, componentTypes, node => targetNode = node),
                        },
                        () => {
                            componentTypes.add(key, {
                                node: assertExists(targetNode),
                            })
                        },
                    )
                },
            ),
            "root type": context.expectString((sourceRootName, range) => {
                rootName = sourceRootName
                rootNameRange = range
            }),
        },
        () => {
            const assertedRootName = assertExists(rootName)
            callback({
                "component types": componentTypes,
                "root type": g.createReference(
                    assertedRootName,
                    () => componentTypes.get(
                        assertedRootName,
                        () => {
                            throw new Error(`component type '${assertedRootName}' not found @ ${bc.printRange(assertExists(rootNameRange))}`)
                        }
                    )
                ),
            })
        }
    )
}
