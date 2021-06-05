import * as astncore from "astn-core"
import * as def from "../definitions"

export type DictOpen<Annotation> = {
    annotation: Annotation
}

export type Entr<Annotation> = {
    annotation: Annotation
    nodeDefinition: def.NodeDefinition
    keyProperty: def.PropertyDefinition
    entry: BSEEntry
}

export type DictClose<Annotation> = {
    annotation: Annotation
}

export type LClose<Annotation> = {
    annotation: Annotation
}

export type Opt<Annotation> = {
    annotation: Annotation
}

export type TU<Annotation> = {
    annotation: Annotation
}

export type UnknownOpt<Annotation> = {
    stateGroupDefinition: def.StateGroupDefinition
    annotation: Annotation
}

export type LOpen<Annotation> = {
    annotation: Annotation
}

export type Val<Annotation> = {
    syncValue: BSEValue
    definition: def.ValueDefinition
    annotation: Annotation
}

export type Prop<Annotation> = {
    nodeDefinition: def.NodeDefinition
    key: string
    nodeBuilder: BSENode
    annotation: Annotation
}

export type SHTClose<Annotation> = {
    annotation: Annotation
}

export type VTClose<Annotation> = {
    annotation: Annotation
}

export type VTOpen<Annotation> = {
    nodeDefinition: def.NodeDefinition
    keyPropertyDefinition: def.PropertyDefinition | null
    nodeBuilder: BSENode
    annotation: Annotation
}

export type SHTOpen<Annotation> = {
    nodeDefinition: def.NodeDefinition
    keyPropertyDefinition: def.PropertyDefinition | null
    nodeBuilder: BSENode
    annotation: Annotation
}

/*
*
*


*
*
*
*/

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
    readonly definition: def.StateGroupDefinition
    readonly comments: BSEComments
    getCurrentState(): BSEState

}

export interface BSEState {
    readonly node: BSENode
    getStateKey(): string
}

export interface BSEValue {
    readonly definition: def.ValueDefinition
    readonly isQuoted: boolean
    readonly comments: BSEComments
    getValue(): string
    getSuggestions(): string[]
}


export interface RootHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    Property,
    ShorthandTypeOpen,
    ShorthandTypeClose,
    TaggedUnion,
    Option,
    Value,
    VerboseTypeOpen,
    VerboseTypeClose,
    > {
    node: NodeHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
    onEnd: ($: {
        //
    }) => void
}

export interface DictionaryHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    Property,
    ShorthandTypeOpen,
    ShorthandTypeClose,
    TaggedUnion,
    Option,
    Value,
    VerboseTypeOpen,
    VerboseTypeClose,
    > {
    onEntry($: {
        data: astncore.PropertyData
        annotation: Entry
    }): NodeHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
    onClose($: {
        annotation: DictionaryClose
    }): void
}

export interface ListHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    Property,
    ShorthandTypeOpen,
    ShorthandTypeClose,
    TaggedUnion,
    Option,
    Value,
    VerboseTypeOpen,
    VerboseTypeClose,
    > {
    onClose($: {
        annotation: ListClose
    }): void
    onEntry(): NodeHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
}

export interface TaggedUnionHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    Property,
    ShorthandTypeOpen,
    ShorthandTypeClose,
    TaggedUnion,
    Option,
    Value,
    VerboseTypeOpen,
    VerboseTypeClose,
    > {
    onOption($: {
        data: astncore.OptionData
        annotation: Option
    }): NodeHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
}

export interface PropertyHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    Property,
    ShorthandTypeOpen,
    ShorthandTypeClose,
    TaggedUnion,
    Option,
    Value,
    VerboseTypeOpen,
    VerboseTypeClose,
    > {
    onList($: {
        data: astncore.ArrayData
        annotation: ListOpen
    }): ListHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
    onDictionary($: {
        data: astncore.ObjectData
        annotation: DictionaryOpen
    }): DictionaryHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
    onComponent(): NodeHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
    onStateGroup($: {
        annotation: TaggedUnion
    }): TaggedUnionHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
    onScalarValue($: {
        value: string
        data: astncore.StringValueData
        annotation: Value
    }): void
    onNull($: {
        data: astncore.StringValueData
        annotation: {
            //annotation: Annotation
        }
    }): void
}

export interface ShorthandTypeHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    Property,
    ShorthandTypeOpen,
    ShorthandTypeClose,
    TaggedUnion,
    Option,
    Value,
    VerboseTypeOpen,
    VerboseTypeClose,
    > {
    onShorthandTypeClose($: {
        annotation: ShorthandTypeClose
    }): void
    onProperty($: {
        annotation: {
            propKey: string
            propDefinition: def.PropertyDefinition
            nodeBuilder: BSENode
        }
    }): PropertyHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
}

export interface TypeHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    Property,
    ShorthandTypeOpen,
    ShorthandTypeClose,
    TaggedUnion,
    Option,
    Value,
    VerboseTypeOpen,
    VerboseTypeClose,
    > {
    onProperty($: {
        data: astncore.PropertyData
        annotation: Property
    }): PropertyHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
    onTypeClose($: {
        annotation: VerboseTypeClose
    }): void
}

export interface NodeHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    Property,
    ShorthandTypeOpen,
    ShorthandTypeClose,
    TaggedUnion,
    Option,
    Value,
    VerboseTypeOpen,
    VerboseTypeClose,
    > {
    onTypeOpen($: {
        data: astncore.ObjectData
        annotation: VerboseTypeOpen
    }): TypeHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
    onShorthandTypeOpen($: {
        data: astncore.ArrayData
        annotation: ShorthandTypeOpen
    }): ShorthandTypeHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        Property,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
}

export type NodeHandler<Annotation> = NodeHandler2<
    DictOpen<Annotation>,
    DictClose<Annotation>,
    null,
    Entr<Annotation>,
    LOpen<Annotation>,
    LClose<Annotation>,
    Prop<Annotation>,
    SHTOpen<Annotation>,
    SHTClose<Annotation>,
    TU<Annotation>,
    Opt<Annotation>,
    Val<Annotation>,
    VTOpen<Annotation>,
    VTClose<Annotation>
>

export type DictionaryHandler<Annotation> = DictionaryHandler2<
    DictOpen<Annotation>,
    DictClose<Annotation>,
    null,
    Entr<Annotation>,
    LOpen<Annotation>,
    LClose<Annotation>,
    Prop<Annotation>,
    SHTOpen<Annotation>,
    SHTClose<Annotation>,
    TU<Annotation>,
    Opt<Annotation>,
    Val<Annotation>,
    VTOpen<Annotation>,
    VTClose<Annotation>
>
export type ListHandler<Annotation> = ListHandler2<
    DictOpen<Annotation>,
    DictClose<Annotation>,
    null,
    Entr<Annotation>,
    LOpen<Annotation>,
    LClose<Annotation>,
    Prop<Annotation>,
    SHTOpen<Annotation>,
    SHTClose<Annotation>,
    TU<Annotation>,
    Opt<Annotation>,
    Val<Annotation>,
    VTOpen<Annotation>,
    VTClose<Annotation>
>
export type TypeHandler<Annotation> = TypeHandler2<
    DictOpen<Annotation>,
    DictClose<Annotation>,
    null,
    Entr<Annotation>,
    LOpen<Annotation>,
    LClose<Annotation>,
    Prop<Annotation>,
    SHTOpen<Annotation>,
    SHTClose<Annotation>,
    TU<Annotation>,
    Opt<Annotation>,
    Val<Annotation>,
    VTOpen<Annotation>,
    VTClose<Annotation>
>
export type ShorthandTypeHandler<Annotation> = ShorthandTypeHandler2<
    DictOpen<Annotation>,
    DictClose<Annotation>,
    null,
    Entr<Annotation>,
    LOpen<Annotation>,
    LClose<Annotation>,
    Prop<Annotation>,
    SHTOpen<Annotation>,
    SHTClose<Annotation>,
    TU<Annotation>,
    Opt<Annotation>,
    Val<Annotation>,
    VTOpen<Annotation>,
    VTClose<Annotation>
>
export type PropertyHandler<Annotation> = PropertyHandler2<
    DictOpen<Annotation>,
    DictClose<Annotation>,
    null,
    Entr<Annotation>,
    LOpen<Annotation>,
    LClose<Annotation>,
    Prop<Annotation>,
    SHTOpen<Annotation>,
    SHTClose<Annotation>,
    TU<Annotation>,
    Opt<Annotation>,
    Val<Annotation>,
    VTOpen<Annotation>,
    VTClose<Annotation>
>
export type TaggedUnionHandler<Annotation> = TaggedUnionHandler2<
    DictOpen<Annotation>,
    DictClose<Annotation>,
    null,
    Entr<Annotation>,
    LOpen<Annotation>,
    LClose<Annotation>,
    Prop<Annotation>,
    SHTOpen<Annotation>,
    SHTClose<Annotation>,
    TU<Annotation>,
    Opt<Annotation>,
    Val<Annotation>,
    VTOpen<Annotation>,
    VTClose<Annotation>
>
export type RootHandler<Annotation> = RootHandler2<
    DictOpen<Annotation>,
    DictClose<Annotation>,
    null,
    Entr<Annotation>,
    LOpen<Annotation>,
    LClose<Annotation>,
    Prop<Annotation>,
    SHTOpen<Annotation>,
    SHTClose<Annotation>,
    TU<Annotation>,
    Opt<Annotation>,
    Val<Annotation>,
    VTOpen<Annotation>,
    VTClose<Annotation>
>