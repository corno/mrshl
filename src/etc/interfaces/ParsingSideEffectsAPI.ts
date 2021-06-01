import * as astncore from "astn-core"
import * as ds from "./syncAPI"
import * as md from "./types"

export interface Root<Annotation> {
    node: Node<Annotation>
    onEnd: ($: {
        //
    }) => void
}

export interface Dictionary<Annotation> {
    onEntry($: {
        data: astncore.PropertyData
        nodeDefinition: md.Node
        keyProperty: md.Property
        entry: ds.Entry
        annotation: Annotation
    }): Node<Annotation>
    onClose($: {
        annotation: Annotation
    }): void
}

export interface List<Annotation> {
    onClose($: {
        annotation: Annotation
    }): void
    onEntry(): Node<Annotation>
}

export interface StateGroup<Annotation> {
    onState($: {
        data: astncore.OptionData
        annotation: Annotation
    }): Node<Annotation>
    onUnexpectedState($: {
        data: astncore.OptionData
        stateGroupDefinition: md.StateGroup
        annotation: Annotation
    }): void
}

export interface Property<Annotation> {
    onList($: {
        data: astncore.ArrayData
        annotation: Annotation
    }): List<Annotation>
    onDictionary($: {
        data: astncore.ObjectData
        annotation: Annotation
    }): Dictionary<Annotation>
    onComponent(): Node<Annotation>
    onStateGroup($: {
        annotation: Annotation
    }): StateGroup<Annotation>
    onScalarValue($: {
        value: string
        data: astncore.StringValueData
        syncValue: ds.Value
        definition: md.Value
        annotation: Annotation
    }): void
    onNull($: {
        data: astncore.StringValueData
        annotation: Annotation
    }): void
}

export interface ShorthandType<Annotation> {
    onShorthandTypeClose($: {
        annotation: Annotation
    }): void
    onProperty($: {
        propKey: string
        propDefinition: md.Property
        nodeBuilder: ds.Node
    }): Property<Annotation>
}

export interface Type<Annotation> {
    onProperty($: {
        data: astncore.PropertyData
        propDefinition: md.Property
        nodeBuilder: ds.Node
        annotation: Annotation
    }): Property<Annotation>
    onUnexpectedProperty($: {
        data: astncore.PropertyData
        expectedProperties: string[]
        annotation: Annotation

    }): void
    onTypeClose($: {
        annotation: Annotation
    }): void
}

export interface Node<Annotation> {
    onTypeOpen($: {
        data: astncore.ObjectData
        nodeDefinition: md.Node
        keyPropertyDefinition: md.Property | null
        nodeBuilder: ds.Node
        annotation: Annotation
    }): Type<Annotation>
    onShorthandTypeOpen($: {
        data: astncore.ArrayData
        nodeDefinition: md.Node
        keyPropertyDefinition: md.Property | null
        nodeBuilder: ds.Node
        annotation: Annotation
    }): ShorthandType<Annotation>
}
