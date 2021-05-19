import * as astn from "astn"
import * as ds from "./syncAPI"
import * as md from "./types"

export interface Root {
    node: Node
    onEnd: () => void
}

export interface Dictionary {
    onDictionaryEntry(
        range: astn.Range,
        nodeDefinition: md.Node,
        keyProperty: md.Property,
        entry: ds.Entry,
    ): Node
    onUnexpectedDictionaryEntry(
        entryRange: astn.Range,
    ): void
    onDictionaryClose(
        range: astn.Range,
        closeData: astn.ObjectCloseData,
    ): void
}

export interface List {
    onListClose(
        range: astn.Range,
        closeData: astn.ArrayCloseData
    ): void
    onListEntry(): Node
    onUnexpectedListEntry(): void
}

export interface Node {
    onTypeOpen(
        range: astn.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null,
        nodeBuilder: ds.Node
    ): void
    onTypeClose(
        range: astn.Range
    ): void
    onArrayTypeOpen(
        openRange: astn.Range,
        openData: astn.ArrayOpenData,
    ): void
    onArrayTypeClose(
        range: astn.Range,
        closeData: astn.ArrayCloseData
    ): void
    onDictionaryOpen(
        dictionaryName: string,
        range: astn.Range,
        openData: astn.ObjectOpenData
    ): Dictionary
    onListOpen(
        name: string,
        range: astn.Range,
        openData: astn.ArrayOpenData
    ): List
    onValue(
        valueName: string,
        syncValue: ds.Value,
        range: astn.Range,
        data: astn.SimpleValueData,
        definition: md.Value,
    ): void
    onProperty(
        propKey: string,
        propRange: astn.Range,
        propDefinition: md.Property,
        nodeBuilder: ds.Node,
    ): void
    onUnexpectedProperty(
        key: string,
        range: astn.Range,
        contextData: astn.ContextData,
        expectedProperties: string[]
    ): void
    onState(
        stateGroupName: string,
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
    onComponent(name: string): Node
}
