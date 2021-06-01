import * as astncore from "astn-core"
import * as md from "./definitions"


import * as t from "./definitions"

export type BSECommentType =
    | ["block"]
    | ["line"]

export interface BSEComment {
    value: string
    type:
    | ["block"]
    | ["line"]
}

export interface BSEComments {
    getComments(): BSEComment[]
}

export type BSEPropertyType =
    | ["list", BSEList]
    | ["dictionary", BSEDictionary]
    | ["component", BSEComponent]
    | ["state group", BSEStateGroup]
    | ["value", BSEValue]

export interface BSEProperty {
    readonly isKeyProperty: boolean
    readonly type: BSEPropertyType
}

export interface BSEDictionary {
    readonly comments: BSEComments

    forEachEntry(callback: (entry: BSEEntry, key: string) => void): void
    isEmpty(): boolean
}
export interface BSEList {
    readonly comments: BSEComments
    forEachEntry(callback: (entry: BSEEntry) => void): void
    isEmpty(): boolean
}

export interface BSEComponent {
    readonly node: BSENode
    readonly comments: BSEComments
}

export interface BSEEntry {
    readonly node: BSENode
    readonly comments: BSEComments
}

export interface BSENode {
    getDictionary(name: string): BSEDictionary
    getList(name: string): BSEList
    getComponent(name: string): BSEComponent
    getStateGroup(name: string): BSEStateGroup
    getValue(name: string): BSEValue
    forEachProperty(callback: (entry: BSEProperty, key: string) => void): void
}
export interface BSEStateGroup {
    readonly definition: t.StateGroupDefinition
    readonly comments: BSEComments
    getCurrentState(): BSEState

}

export interface BSEState {
    readonly node: BSENode
    getStateKey(): string
}

export interface BSEValue {
    readonly definition: t.ValueDefinition
    readonly isQuoted: boolean
    readonly comments: BSEComments
    getValue(): string
    getSuggestions(): string[]
}


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
        entry: BSEEntry
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
        syncValue: BSEValue
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
        nodeBuilder: BSENode
    }): PropertyHandler<Annotation>
}

export interface TypeHandler<Annotation> {
    onProperty($: {
        data: astncore.PropertyData
        propDefinition: md.PropertyDefinition
        nodeBuilder: BSENode
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
        nodeBuilder: BSENode
        annotation: Annotation
    }): TypeHandler<Annotation>
    onShorthandTypeOpen($: {
        data: astncore.ArrayData
        nodeDefinition: md.NodeDefinition
        keyPropertyDefinition: md.PropertyDefinition | null
        nodeBuilder: BSENode
        annotation: Annotation
    }): ShorthandTypeHandler<Annotation>
}
