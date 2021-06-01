import * as astncore from "astn-core"
import * as ds from "./syncAPI"
import * as md from "./definitions"

export interface RootHandler<Annotation> {
    node: NodeHandler<Annotation>
    onEnd: ($: {
        //
    }) => void
}

export interface DictionaryHandler<Annotation> {
    onEntry($: {
        data: astncore.PropertyData
        nodeDefinition: md.NodeDefinition
        keyProperty: md.PropertyDefinition
        entry: ds.Entry
        annotation: Annotation
    }): NodeHandler<Annotation>
    onClose($: {
        annotation: Annotation
    }): void
}

export interface ListHandler<Annotation> {
    onClose($: {
        annotation: Annotation
    }): void
    onEntry(): NodeHandler<Annotation>
}

export interface StateGroupHandler<Annotation> {
    onState($: {
        data: astncore.OptionData
        annotation: Annotation
    }): NodeHandler<Annotation>
    onUnexpectedState($: {
        data: astncore.OptionData
        stateGroupDefinition: md.StateGroupDefinition
        annotation: Annotation
    }): void
}

export interface PropertyHandler<Annotation> {
    onList($: {
        data: astncore.ArrayData
        annotation: Annotation
    }): ListHandler<Annotation>
    onDictionary($: {
        data: astncore.ObjectData
        annotation: Annotation
    }): DictionaryHandler<Annotation>
    onComponent(): NodeHandler<Annotation>
    onStateGroup($: {
        annotation: Annotation
    }): StateGroupHandler<Annotation>
    onScalarValue($: {
        value: string
        data: astncore.StringValueData
        syncValue: ds.Value
        definition: md.ValueDefinition
        annotation: Annotation
    }): void
    onNull($: {
        data: astncore.StringValueData
        annotation: Annotation
    }): void
}

export interface ShorthandTypeHandler<Annotation> {
    onShorthandTypeClose($: {
        annotation: Annotation
    }): void
    onProperty($: {
        propKey: string
        propDefinition: md.PropertyDefinition
        nodeBuilder: ds.Node
    }): PropertyHandler<Annotation>
}

export interface TypeHandler<Annotation> {
    onProperty($: {
        data: astncore.PropertyData
        propDefinition: md.PropertyDefinition
        nodeBuilder: ds.Node
        annotation: Annotation
    }): PropertyHandler<Annotation>
    onUnexpectedProperty($: {
        data: astncore.PropertyData
        expectedProperties: string[]
        annotation: Annotation

    }): void
    onTypeClose($: {
        annotation: Annotation
    }): void
}

export interface NodeHandler<Annotation> {
    onTypeOpen($: {
        data: astncore.ObjectData
        nodeDefinition: md.NodeDefinition
        keyPropertyDefinition: md.PropertyDefinition | null
        nodeBuilder: ds.Node
        annotation: Annotation
    }): TypeHandler<Annotation>
    onShorthandTypeOpen($: {
        data: astncore.ArrayData
        nodeDefinition: md.NodeDefinition
        keyPropertyDefinition: md.PropertyDefinition | null
        nodeBuilder: ds.Node
        annotation: Annotation
    }): ShorthandTypeHandler<Annotation>
}
