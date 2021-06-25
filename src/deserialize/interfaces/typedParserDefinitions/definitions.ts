import * as g from "./generics"

/**
 * this set of types defines a schema that only describes the data structure,
 * not any additional validation rules to which a dataset should confirm.
 */

export type ComponentDefinition = {
    readonly "type": g.IReference<ComponentTypeDefinition>
}

export type ComponentTypeDefinition = {
    readonly "node": NodeDefinition
}

export type DictionaryDefinition = {
    readonly "key": StringValueDefinition
    readonly "node": NodeDefinition
}

export type ListDefinition = {
    readonly "node": NodeDefinition
}

export type NodeDefinition = {
    readonly "properties": g.IReadonlyDictionary<PropertyDefinition>
}

export type PropertyDefinition = {
    readonly "type": PropertyTypeDefinition
}

export type PropertyTypeDefinition =
    | ["dictionary", DictionaryDefinition]
    | ["list", ListDefinition]
    | ["component", ComponentDefinition]
    | ["tagged union", TaggedUnionDefinition]
    | ["string", StringValueDefinition]

export type Schema = {
    readonly "component types": g.IReadonlyDictionary<ComponentTypeDefinition>
    readonly "root type": g.IReference<ComponentTypeDefinition>
}

export type OptionDefinition = {
    readonly "node": NodeDefinition
}

export type TaggedUnionDefinition = {
    readonly "options": g.IReadonlyDictionary<OptionDefinition>
    readonly "default option": g.IReference<OptionDefinition>
}

export type StringValueDefinition = {
    readonly "default value": string
    readonly "quoted": boolean
}
