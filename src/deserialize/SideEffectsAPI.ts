import * as bc from "bass-clarinet"
import * as ds from "../datasetAPI"
import * as md from "../metaDataSchema"

export type GenerateSnippets = () => string[]

export interface SideEffectsAPI {
    onTypeOpen(
        range: bc.Range,
        nodeDefinition: md.Node,
        keyPropertyDefinition: md.Property | null,
        nodeBuilder: ds.NodeBuilder
    ): void
    onTypeClose(range: bc.Range): void
    onArrayTypeOpen(openData: bc.OpenData): void
    onArrayTypeClose(closeData: bc.CloseData): void
    onDictionaryOpen(openData: bc.OpenData): void
    onDictionaryClose(closeData: bc.CloseData): void
    onDictionaryEntry(
        entryData: bc.PropertyData,
        nodeDefinition: md.Node,
        keyProperty: md.Property,
        entry: ds.DictionaryEntry,
    ): void
    onUnexpectedDictionaryEntry(
        entryData: bc.PropertyData,
    ): void
    onListOpen(openData: bc.OpenData): void
    onListClose(closeData: bc.CloseData): void
    onListEntry(): void
    onValue(data: bc.StringData, value: ds.Value): void
    onProperty(
        data: bc.PropertyData,
        propKey: string,
        propDefinition: md.Property,
        nodeBuilder: ds.NodeBuilder,
    ): void
    onUnexpectedProperty(
        key: string,
        data: bc.PropertyData,
        preData: bc.PreData,
        expectedProperties: string[]
    ): void
    onState(): void
    onState(
        stateName: string,
        tuData: bc.TaggedUnionData,
        beginPreData: bc.PreData,
        optionPreData: bc.PreData
    ): void
    onUnexpectedState(
        stateName: string,
        tuData: bc.TaggedUnionData,
        beginPreData: bc.PreData,
        optionData: bc.OptionData,
        optionPreData: bc.PreData,
        stateGroupDefinition: md.StateGroup
    ): void
}
