import * as astn from "astn"
import * as ds from "./syncAPI"
import * as md from "./types"

export interface Root<Annotation> {
    node: Node<Annotation>
    onEnd: () => void
}

export interface Dictionary<Annotation> {
    onEntry(
        data: astn.PropertyData<Annotation>,
        nodeDefinition: md.Node,
        keyProperty: md.Property,
        entry: ds.Entry,
    ): Node<Annotation>
    onClose(data: astn.ObjectEndData<Annotation>): void
}

export interface List<Annotation> {
    onClose(
        data: astn.ArrayEndData<Annotation>
    ): void
    onEntry(): Node<Annotation>
}

export interface StateGroup<Annotation> {
    onState(
        data: astn.OptionData<Annotation>
    ): Node<Annotation>
    onUnexpectedState(
        data: astn.OptionData<Annotation>,
        stateGroupDefinition: md.StateGroup
    ): void
}

export interface Property<Annotation> {
    onList(data: astn.ArrayBeginData<Annotation>): List<Annotation>
    onDictionary(data: astn.ObjectBeginData<Annotation>): Dictionary<Annotation>
    onComponent(): Node<Annotation>
    onStateGroup(data: astn.TaggedUnionData<Annotation>
    ): StateGroup<Annotation>
    onValue(
        data: astn.SimpleValueData2<Annotation>,
        syncValue: ds.Value,
        definition: md.Value,
    ): void
    onNull(
        data: astn.SimpleValueData2<Annotation>
    ): void
}

export interface ShorthandType<Annotation> {
    onShorthandTypeClose(
        data: astn.ArrayEndData<Annotation>
    ): void
    onProperty(
        propKey: string,
        propDefinition: md.Property,
        nodeBuilder: ds.Node,
    ): Property<Annotation>
}

export interface Type<Annotation> {
    onProperty(
        data: astn.PropertyData<Annotation>,
        propDefinition: md.Property,
        nodeBuilder: ds.Node,
    ): Property<Annotation>
    onUnexpectedProperty(
        data: astn.PropertyData<Annotation>,
        expectedProperties: string[]
    ): void
    onTypeClose(
        data: astn.ObjectEndData<Annotation>
    ): void
}

export interface Node<Annotation> {
    onTypeOpen(
        data: astn.ObjectBeginData<Annotation>,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null,
        nodeBuilder: ds.Node
    ): Type<Annotation>
    onShorthandTypeOpen(
        data: astn.ArrayBeginData<Annotation>,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null,
        nodeBuilder: ds.Node
    ): ShorthandType<Annotation>
}
