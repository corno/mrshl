/* eslint
    quote-props: "off",

*/
import * as bc from "bass-clarinet"
import * as g from "./generics"
import * as t from "./types"

function assertIsDeserialized<T>(v: T | null) {
    if (v === null) {
        throw new Error("value was not deserialized")
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
                            "type": context.expectTaggedUnionOrArraySurrogate((propertyType, ptRange) => {
                                switch (propertyType) {
                                    case "collection": {
                                        let targetCollectionType: t.CollectionType | null = null
                                        return context.expectType(
                                            {
                                                "type": context.expectTaggedUnionOrArraySurrogate((sourceCollectionType, sctRange) => {
                                                    switch (sourceCollectionType) {
                                                        case "dictionary": {
                                                            let targetHasInstances: t.DictionaryHasInstances | null = null
                                                            return context.expectType(
                                                                {
                                                                    "has instances": context.expectTaggedUnionOrArraySurrogate((sourceHasInstances, shiRange) => {
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
                                                                                        const assertedTargetNode = assertIsDeserialized(targetNode)
                                                                                        const assertedTargetKeyProperty = assertIsDeserialized(targetKeyProperty)
                                                                                        targetHasInstances = ["yes", {
                                                                                            "node": assertedTargetNode,
                                                                                            "key property": g.createReference(
                                                                                                assertedTargetKeyProperty,
                                                                                                assertedTargetNode.properties,
                                                                                                () => {
                                                                                                    throw new bc.RangeError(
                                                                                                        `key property '${assertedTargetKeyProperty}' not found `,
                                                                                                        assertIsDeserialized(targetKeyPropertyRange),
                                                                                                    )
                                                                                                }
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
                                                                                throw new bc.RangeError(`unexpected 'has instances' type ${sourceHasInstances}`, shiRange)
                                                                        }
                                                                    }),
                                                                },
                                                                () => {
                                                                    targetCollectionType = ["dictionary", {
                                                                        "has instances": assertIsDeserialized(targetHasInstances),
                                                                    }]
                                                                }
                                                            )
                                                        }
                                                        case "list": {
                                                            let targetHasInstances: t.ListHasInstances | null = null
                                                            return context.expectType(
                                                                {
                                                                    "has instances": context.expectTaggedUnionOrArraySurrogate((sourceHasInstances, shiRange) => {
                                                                        switch (sourceHasInstances) {
                                                                            case "yes": {
                                                                                let targetNode: t.Node | null = null
                                                                                return context.expectType(
                                                                                    {
                                                                                        "node": deserializeMetaNode(context, componentTypes, node => targetNode = node),
                                                                                    },
                                                                                    () => {

                                                                                        targetHasInstances = ["yes", {
                                                                                            node: assertIsDeserialized(targetNode),
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
                                                                                throw new bc.RangeError(`unexpected 'has instances' type ${sourceHasInstances}`, shiRange)
                                                                        }
                                                                    }),
                                                                },
                                                                () => {
                                                                    targetCollectionType = ["list", {
                                                                        "has instances": assertIsDeserialized(targetHasInstances),
                                                                    }]
                                                                },
                                                            )
                                                        }
                                                        default:
                                                            throw new bc.RangeError(`unexpected 'collection' type ${sourceCollectionType}`, sctRange)
                                                    }
                                                }),
                                            },
                                            () => {
                                                targetPropertyType = ["collection", {
                                                    "type": assertIsDeserialized(targetCollectionType),
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
                                                const assertedTargetComponentTypeName = assertIsDeserialized(targetComponentTypeName)
                                                targetPropertyType = ["component", {
                                                    "type": g.createReference(
                                                        assertedTargetComponentTypeName,
                                                        componentTypes,
                                                        () => {
                                                            throw new bc.RangeError(
                                                                `component type '${assertedTargetComponentTypeName}' not found`,
                                                                assertIsDeserialized(targetComponentTypeNameRange)
                                                            )
                                                        },
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
                                                                node: assertIsDeserialized(targetNode),
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
                                                "type": context.expectTaggedUnionOrArraySurrogate((sourceValueType, range) => {
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
                                                            throw new bc.RangeError(`unexpected 'value' type ${sourceValueType}`, range)
                                                    }
                                                }),
                                            },
                                            () => {
                                                targetPropertyType = ["value", {
                                                    "type": assertIsDeserialized(targetValueType),
                                                }]
                                            },
                                        )
                                    }
                                    default:
                                        throw new bc.RangeError(`unexpected 'property' type ${propertyType}`, ptRange)
                                }
                            }),
                        },
                        () => {
                            properties.add(key, {
                                type: assertIsDeserialized(targetPropertyType),
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
                                node: assertIsDeserialized(targetNode),
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
            const assertedRootName = assertIsDeserialized(rootName)
            callback({
                "component types": componentTypes,
                "root type": g.createReference(
                    assertedRootName,
                    componentTypes,
                    () => {
                        throw new bc.RangeError(`component type '${assertedRootName}' not found`, assertIsDeserialized(rootNameRange))
                    }
                ),
            })
        }
    )
}
