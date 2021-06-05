import * as astncore from "astn-core"

export interface RootHandler2<
    DictionaryOpen,
    DictionaryClose,
    Element,
    Entry,
    ListOpen,
    ListClose,
    VerboseProperty,
    ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
    VerboseProperty,
    ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
    VerboseProperty,
    ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
    VerboseProperty,
    ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
    VerboseProperty,
    ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
    VerboseProperty,
    ShorthandProperty,
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
        annotation: ShorthandProperty
    }): PropertyHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        VerboseProperty,
        ShorthandProperty,
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
    VerboseProperty,
    ShorthandProperty,
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
        annotation: VerboseProperty
    }): PropertyHandler2<
        DictionaryOpen,
        DictionaryClose,
        Element,
        Entry,
        ListOpen,
        ListClose,
        VerboseProperty,
        ShorthandProperty,
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
    VerboseProperty,
    ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
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
        VerboseProperty,
        ShorthandProperty,
        ShorthandTypeOpen,
        ShorthandTypeClose,
        TaggedUnion,
        Option,
        Value,
        VerboseTypeOpen,
        VerboseTypeClose
    >
}