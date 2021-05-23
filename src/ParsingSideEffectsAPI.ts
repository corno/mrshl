import * as astn from "astn"
import * as ds from "./syncAPI"
import * as md from "./types"

export interface Root {
    node: Node
    onEnd: () => void
}

export interface Dictionary {
    onEntry(
        range: astn.Range,
        nodeDefinition: md.Node,
        keyProperty: md.Property,
        entry: ds.Entry,
    ): Node
    onUnexpectedEntry(
        entryRange: astn.Range,
    ): void
    onClose(
        range: astn.Range,
        closeData: astn.ObjectCloseData,
    ): void
}

export interface List {
    onClose(
        range: astn.Range,
        closeData: astn.ArrayCloseData
    ): void
    onEntry(): Node
    onUnexpectedEntry(): void
}

export interface StateGroup {
    onState(
        stateName: string,
        tuRange: astn.Range,
        beginPreData: astn.ContextData,
        optionRange: astn.Range,
        optionPreData: astn.ContextData
    ): Node
    onUnexpectedState(
        stateName: string,
        tuRange: astn.Range,
        beginPreData: astn.ContextData,
        optionRange: astn.Range,
        optionPreData: astn.ContextData,
        stateGroupDefinition: md.StateGroup
    ): void
}

export interface Property {
    onList(
        range: astn.Range,
        openData: astn.ArrayOpenData
    ): List
    onDictionary(
        range: astn.Range,
        openData: astn.ObjectOpenData
    ): Dictionary
    onComponent(): Node
    onStateGroup(
    ): StateGroup
    onValue(
        syncValue: ds.Value,
        range: astn.Range,
        data: astn.SimpleValueData,
        definition: md.Value,
    ): void
    onNull(range: astn.Range): void
}

export interface ShorthandType {
    onShorthandTypeClose(
        range: astn.Range,
        closeData: astn.ArrayCloseData
    ): void
    onProperty(
        propKey: string,
        propDefinition: md.Property,
        nodeBuilder: ds.Node,
    ): Property
}

export interface Type {
    onProperty(
        propKey: string,
        propRange: astn.Range,
        propDefinition: md.Property,
        nodeBuilder: ds.Node,
    ): Property
    onUnexpectedProperty(
        key: string,
        range: astn.Range,
        contextData: astn.ContextData,
        expectedProperties: string[]
    ): void
    onTypeClose(
        range: astn.Range
    ): void
}

export interface Node {
    onTypeOpen(
        range: astn.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null,
        nodeBuilder: ds.Node
    ): Type
    onShorthandTypeOpen(
        range: astn.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null,
        nodeBuilder: ds.Node
    ): ShorthandType
}
