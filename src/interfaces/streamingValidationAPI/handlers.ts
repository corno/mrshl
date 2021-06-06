
import * as def from "../definitions"
import * as astncore from "astn-core"

export interface RootHandler<Annotation> {
    node: NodeHandler<Annotation>
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
            keyProperty: def.PropertyDefinition
            //entry: BSEEntry
        }
    }): NodeHandler<Annotation>
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
    onEntry(): NodeHandler<Annotation>
}

export interface TaggedUnionHandler<Annotation> {
    onOption($: {
        data: astncore.OptionData
        annotation: {
            annotation: Annotation
        }
    }): NodeHandler<Annotation>
}

export interface PropertyHandler<Annotation> {
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
    onComponent(): NodeHandler<Annotation>
    onStateGroup($: {
        annotation: {
            annotation: Annotation
        }
    }): TaggedUnionHandler<Annotation>
    onScalarValue($: {
        value: string
        data: astncore.StringValueData
        annotation: {
            syncValue: {
                getSuggestions(): string[]
            }
            definition: def.ValueDefinition
            annotation: Annotation
        }
    }): void
    onNull($: {
        data: astncore.StringValueData
        annotation: {
            //annotation: Annotation
        }
    }): void
}

export interface ShorthandTypeHandler<Annotation> {
    onProperty($: {
        annotation: {
            propKey: string
            propDefinition: def.PropertyDefinition
            //annotation: Annotation
        }
    }): PropertyHandler<Annotation>
    onShorthandTypeClose($: {
        annotation: {
            annotation: Annotation
        }
    }): void
}

export interface VerboseTypeHandler<Annotation> {
    onProperty($: {
        data: astncore.PropertyData
        annotation: {
            nodeDefinition: def.NodeDefinition
            key: string
            annotation: Annotation
        }
    }): PropertyHandler<Annotation>
    onTypeClose($: {
        annotation: {
            annotation: Annotation
        }
    }): void
}

export interface NodeHandler<Annotation> {
    onTypeOpen($: {
        data: astncore.ObjectData
        annotation: {
            nodeDefinition: def.NodeDefinition
            keyPropertyDefinition: def.PropertyDefinition | null
            annotation: Annotation
        }
    }): VerboseTypeHandler<Annotation>
    onShorthandTypeOpen($: {
        data: astncore.ArrayData
        annotation: {
            nodeDefinition: def.NodeDefinition
            keyPropertyDefinition: def.PropertyDefinition | null
            annotation: Annotation
        }
    }): ShorthandTypeHandler<Annotation>
}