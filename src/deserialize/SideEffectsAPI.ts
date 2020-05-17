import * as bc from "bass-clarinet"
import * as ds from "../syncAPI"
import * as md from "../metaDataSchema"

export type GenerateSnippets = () => string[]

export interface DictionarySideEffectsAPI {
    onDictionaryEntry(
        entryData: bc.PropertyData,
        nodeDefinition: md.Node,
        keyProperty: md.Property,
        entry: ds.Entry,
    ): NodeSideEffectsAPI
    onUnexpectedDictionaryEntry(
        entryData: bc.PropertyData,
    ): void
    onDictionaryClose(closeData: bc.CloseData): void
}

export interface ListSideEffectsAPI {
    onListClose(closeData: bc.CloseData): void
    onListEntry(): NodeSideEffectsAPI
    onUnexpectedListEntry(): void
}

export interface NodeSideEffectsAPI {
    onTypeOpen(
        range: bc.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null,
        nodeBuilder: ds.Node
    ): void
    onTypeClose(range: bc.Range): void
    onArrayTypeOpen(openData: bc.OpenData): void
    onArrayTypeClose(closeData: bc.CloseData): void
    onDictionaryOpen(
        dictionaryName: string,
        openData: bc.OpenData
    ): DictionarySideEffectsAPI
    onListOpen(name: string, openData: bc.OpenData): ListSideEffectsAPI
    onValue(
        valueName: string,
        data: bc.StringData,
        value: ds.Value
        ): void
    onProperty(
        data: bc.PropertyData,
        propKey: string,
        propDefinition: md.Property,
        nodeBuilder: ds.Node,
    ): void
    onUnexpectedProperty(
        key: string,
        data: bc.PropertyData,
        preData: bc.PreData,
        expectedProperties: string[]
    ): void
    onState(
        stateGroupName: string,
        stateName: string,
        tuData: bc.SimpleMetaData,
        beginPreData: bc.PreData,
        optionPreData: bc.PreData
    ): NodeSideEffectsAPI
    onUnexpectedState(
        stateName: string,
        tuData: bc.SimpleMetaData,
        beginPreData: bc.PreData,
        optionData: bc.SimpleMetaData,
        optionPreData: bc.PreData,
        stateGroupDefinition: md.StateGroup
    ): void
    onComponent(name: string): NodeSideEffectsAPI
}
