import * as bc from "bass-clarinet"
import * as g from "./generics"
import * as t from "./types"
import { Range } from "bass-clarinet"

function deserializeMetaNode(context: bc.ErrorContext, componentTypes: g.IReadonlyDictionary<t.ComponentType>, callback: (node: t.Node) => void): bc.ValueHandler {
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
                                                                                let targetKeyPropertyRange: Range | null = null
                                                                                return context.expectType(
                                                                                    {
                                                                                        "node": deserializeMetaNode(context, componentTypes, node => targetNode = node),
                                                                                        "key property": context.expectString((sourceKeyProperty, range) => {
                                                                                             targetKeyProperty = sourceKeyProperty
                                                                                             targetKeyPropertyRange = range
                                                                                        })
                                                                                    },
                                                                                    () => {
                                                                                        targetHasInstances = ["yes", {
                                                                                            node: targetNode!,
                                                                                            "key property": g.createReference(targetKeyProperty!, () => targetNode!.properties.get(targetKeyProperty!, () => { throw new Error(`key property '${targetKeyProperty!}' not found @ ${bc.printRange(targetKeyPropertyRange!)}`)}))
                                                                                        }]
                                                                                    }
                                                                                )
                                                                            }
                                                                            case "no": {
                                                                                targetHasInstances = ["no", {}]
                                                                                return context.expectType({}, () => { })
                                                                            }
                                                                            default:
                                                                                throw new Error(`uncontext.expected has instances type ${sourceHasInstances}`)
                                                                        }
                                                                    })
                                                                },
                                                                () => {
                                                                    targetCollectionType = ["dictionary", {
                                                                        "has instances": targetHasInstances!
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
                                                                                        "node": deserializeMetaNode(context, componentTypes, node => targetNode = node)
                                                                                    },
                                                                                    () => {

                                                                                        targetHasInstances = ["yes", {
                                                                                            node: targetNode!
                                                                                        }]
                                                                                    }
                                                                                )
                                                                            }
                                                                            case "no": {
                                                                                targetHasInstances = ["no", {}]
                                                                                return context.expectType({}, () => { })
                                                                            }
                                                                            default:
                                                                                throw new Error(`uncontext.expected has instances type ${sourceHasInstances}`)
                                                                        }
                                                                    })
                                                                },
                                                                () => {
                                                                    targetCollectionType = ["list", {
                                                                        "has instances": targetHasInstances!
                                                                    }]
                                                                }
                                                            )
                                                        }
                                                        default:
                                                            throw new Error(`uncontext.expected collection type ${sourceCollectionType}`)
                                                    }
                                                })
                                            },
                                            () => {
                                                targetPropertyType = ["collection", {
                                                    "type": targetCollectionType!
                                                }]
                                            }
                                        )

                                    }
                                    case "component": {
                                        let targetComponentTypeName: string | null = null
                                        let targetComponentTypeNameRange: Range | null = null
                                        return context.expectType(
                                            {
                                                "type": context.expectString((sourceComponentTypeName, range) => { 
                                                    targetComponentTypeName = sourceComponentTypeName
                                                    targetComponentTypeNameRange = range
                                                })
                                            },
                                            () => {
                                                targetPropertyType = ["component", {
                                                    "type": g.createReference(targetComponentTypeName!, () => componentTypes.get(targetComponentTypeName!, () => { throw new Error(`component type '${targetComponentTypeName!}' not found @ ${bc.printRange(targetComponentTypeNameRange!)}`)})),
                                                }]
                                            }
                                        )
                                    }
                                    case "state group": {
                                        const states = new g.Dictionary<t.State>({})
                                        return context.expectType(
                                            {
                                                "states": context.expectDictionary(key => {
                                                    let targetNode: t.Node | null = null
                                                    return context.expectType(
                                                        {
                                                            "node": deserializeMetaNode(context, componentTypes, node => targetNode = node)
                                                        },
                                                        () => {
                                                            states.add(key, {
                                                                node: targetNode!
                                                            })
                                                        }
                                                    )
                                                })
                                            },
                                            () => {
                                                targetPropertyType = ["state group", {
                                                    "states": states
                                                }]
                                            }
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
                                                            return context.expectType({}, () => { })
                                                        }
                                                        case "text": {
                                                            targetValueType = ["string", {}]
                                                            return context.expectType({}, () => { })
                                                        }
                                                        default:
                                                            throw new Error(`uncontext.expected value type ${sourceValueType}`)
                                                    }
                                                })
                                            },
                                            () => {
                                                targetPropertyType = ["value", {
                                                    "type": targetValueType!
                                                }]
                                            }
                                        )
                                    }
                                    default:
                                        throw new Error(`uncontext.expected property type ${propertyType}`)
                                }
                            })
                        },
                        () => {
                            properties.add(key, {
                                type: targetPropertyType!
                            })
                        }
                    )
                }
            )
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

    const context = new bc.ErrorContext(null, null)

    return context.createTypeHandler(
        {
            "component types": context.expectDictionary(
                key => {
                    let targetNode: t.Node | null = null
                    return context.expectType(
                        {
                            "node": deserializeMetaNode(context, componentTypes, node => targetNode = node)
                        },
                        () => {
                            componentTypes.add(key, {
                                node: targetNode!,
                            })
                        }
                    )
                }
            ),
            "root type": context.expectString((sourceRootName, range) => {
                rootName = sourceRootName
                rootNameRange = range
            })
        },
        () => {
            callback({
                "component types": componentTypes,
                "root type": g.createReference(rootName!, () => componentTypes.get(rootName!, () => { throw new Error(`component type '${rootName!}' not found @ ${bc.printRange(rootNameRange!)}`)})),
            })
        }
    )
}
