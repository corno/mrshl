
import * as def from "../typedParserDefinitions"
import * as astncore from "astn-core"

export interface RootHandler<Annotation> {
    root: ValueHandler<Annotation>
    onEnd: ($: {
        //
    }) => void
}

export interface DictionaryHandler<Annotation> {
    onEntry($: {
        data: astncore.PropertyData
        annotation: {
            annotation: Annotation
            nodeDefinition: def.NodeDefinition
            //entry: BSEEntry
        }
    }): ValueHandler<Annotation>
    onClose($: {
        annotation: {
            annotation: Annotation
        }
    }): void
}

export interface ListHandler<Annotation> {
    onClose($: {
        annotation: {
            annotation: Annotation
        }
    }): void
    onEntry(): ValueHandler<Annotation>
}

export interface TaggedUnionHandler<Annotation> {
    onOption($: {
        data: astncore.OptionData
        annotation: {
            definition: def.OptionDefinition
            annotation: Annotation
        }
    }): ValueHandler<Annotation>
    onUnexpectedOption($: {
        data: astncore.OptionData
        annotation: {
            annotation: Annotation
        }
    }): void
}

export interface ShorthandTypeHandler<Annotation> {
    onProperty($: {
        annotation: {
            propKey: string
            definition: def.PropertyDefinition
        }
    }): ValueHandler<Annotation>
    onShorthandTypeClose($: {
        annotation: {
            annotation: Annotation | null //null if the shorthand type is mixed in
        }
    }): void
}

export interface VerboseTypeHandler<Annotation> {
    onUnexpectedProperty($: {
        data: astncore.PropertyData
        annotation: {
            nodeDefinition: def.NodeDefinition
            key: string
            annotation: Annotation
        }
    }): void
    onProperty($: {
        data: astncore.PropertyData
        annotation: {
            definition: def.PropertyDefinition
            key: string
            annotation: Annotation
        }
    }): ValueHandler<Annotation>
    onVerboseTypeClose($: {
        annotation: {
            annotation: Annotation
        }
    }): void
}

export interface ValueHandler<Annotation> {
    onVerboseTypeOpen($: {
        data: astncore.ObjectData
        annotation: {
            nodeDefinition: def.NodeDefinition
            annotation: Annotation
        }
    }): VerboseTypeHandler<Annotation>
    onShorthandTypeOpen($: {
        data: astncore.ArrayData
        annotation: {
            nodeDefinition: def.NodeDefinition
            annotation: Annotation | null //null if the shorthand type is mixed in
        }
    }): ShorthandTypeHandler<Annotation>
    onList($: {
        data: astncore.ArrayData
        annotation: {
            annotation: Annotation
        }
    }): ListHandler<Annotation>
    onDictionary($: {
        data: astncore.ObjectData
        annotation: {
            annotation: Annotation
        }
    }): DictionaryHandler<Annotation>
    onComponent(): ValueHandler<Annotation>
    onTaggedUnion($: {
        annotation: {
            definition: def.TaggedUnionDefinition
            annotation: Annotation | null //is null for shorthand notations
        }
    }): TaggedUnionHandler<Annotation>
    onSimpleString($: {
        value: string
        data: astncore.SimpleStringData
        annotation: {
            getSuggestions(): string[]
            definition: def.SimpleStringDefinition
            annotation: Annotation
        }
    }): void
    onMultilineString($: {
        value: string
        data: astncore.MultilineStringValueData
        annotation: {
            getSuggestions(): string[]
            definition: def.SimpleStringDefinition
            annotation: Annotation
        }
    }): void
    onNull($: {
        data: astncore.SimpleStringData
        annotation: {
            annotation: Annotation
        }
    }): void
}