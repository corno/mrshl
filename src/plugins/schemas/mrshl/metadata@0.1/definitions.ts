import * as g from "../../../../interfaces/typedParserDefinitions/generics"

/**
 * this set of types defines a schema that only describes the data structure,
 * not any additional validation rules to which a dataset should confirm.
 * The DB5 database requires an instance of this schema to load the data
 */

 export type CollectionDefinition = {
    readonly "type": CollectionTypeDefinition
}

export type CollectionTypeDefinition =
    | ["dictionary", DictionaryDefinition]
    | ["list", ListDefinition]

export type ComponentDefinition = {
    readonly "type": g.IReference<ComponentTypeDefinition>
}

export type ComponentTypeDefinition = {
    readonly "node": NodeDefinition
}

export type DictionaryDefinition = {
    readonly "key property": g.IReference<PropertyDefinition>
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
    | ["collection", CollectionDefinition]
    | ["component", ComponentDefinition]
    | ["state group", StateGroupDefinition]
    | ["value", ValueDefinition]

export type Schema = {
    readonly "component types": g.IReadonlyDictionary<ComponentTypeDefinition>
    readonly "root type": g.IReference<ComponentTypeDefinition>
}

export type StateDefinition = {
    readonly "node": NodeDefinition
}

export type StateGroupDefinition = {
    readonly "states": g.IReadonlyDictionary<StateDefinition>
    readonly "default state": g.IReference<StateDefinition>
}

export type ValueDefinition = {
    readonly "default value": string
    readonly "quoted": boolean
}
