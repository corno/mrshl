import * as bc from "bass-clarinet"
import * as ds from "./syncAPI"
import * as md from "./types"

export interface Root {
    node: Node
    onEnd: () => void
}

export interface Dictionary {
    onDictionaryEntry(
        range: bc.Range,
        nodeDefinition: md.Node,
        keyProperty: md.Property,
        entry: ds.Entry,
    ): Node
    onUnexpectedDictionaryEntry(
        entryRange: bc.Range,
    ): void
    onDictionaryClose(
        range: bc.Range,
        closeData: bc.CloseData,
    ): void
}

export interface List {
    onListClose(
        range: bc.Range,
        closeData: bc.CloseData
    ): void
    onListEntry(): Node
    onUnexpectedListEntry(): void
}

export interface Node {
    onTypeOpen(
        range: bc.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null,
        nodeBuilder: ds.Node
    ): void
    onTypeClose(
        range: bc.Range
    ): void
    onArrayTypeOpen(
        openRange: bc.Range,
        openData: bc.OpenData,
    ): void
    onArrayTypeClose(
        range: bc.Range,
        closeData: bc.CloseData
    ): void
    onDictionaryOpen(
        dictionaryName: string,
        range: bc.Range,
        openData: bc.OpenData
    ): Dictionary
    onListOpen(
        name: string,
        range: bc.Range,
        openData: bc.OpenData
    ): List
    onValue(
        valueName: string,
        syncValue: ds.Value,
        range: bc.Range,
        data: bc.SimpleValueData,
        definition: md.Value,
    ): void
    onProperty(
        propKey: string,
        propRange: bc.Range,
        propDefinition: md.Property,
        nodeBuilder: ds.Node,
    ): void
    onUnexpectedProperty(
        key: string,
        range: bc.Range,
        contextData: bc.ContextData,
        expectedProperties: string[]
    ): void
    onState(
        stateGroupName: string,
        stateName: string,
        tuRange: bc.Range,
        beginPreData: bc.ContextData,
        optionRange: bc.Range,
        optionPreData: bc.ContextData
    ): Node
    onUnexpectedState(
        stateName: string,
        tuRange: bc.Range,
        beginPreData: bc.ContextData,
        optionRange: bc.Range,
        optionPreData: bc.ContextData,
        stateGroupDefinition: md.StateGroup
    ): void
    onComponent(name: string): Node
}
