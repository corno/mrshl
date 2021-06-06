
import * as h from "../handlers"
import * as def from "../definitions"


export type DictOpen<Annotation>  = {
    annotation: Annotation
}

export type Entr<Annotation>  = {
    annotation: Annotation
    nodeDefinition: def.NodeDefinition
    keyProperty: def.PropertyDefinition
    //entry: BSEEntry
}

export type DictClose<Annotation>  = {
    annotation: Annotation
}

export type LClose<Annotation>  = {
    annotation: Annotation
}

export type Opt<Annotation>  = {
    annotation: Annotation
}

export type TU<Annotation>  = {
    annotation: Annotation
}

export type LOpen<Annotation>  = {
    annotation: Annotation
}

export type Val<Annotation>  = {
    syncValue: {
        getSuggestions(): string[]
    }
    definition: def.ValueDefinition
    annotation: Annotation
}

export type VProp<Annotation>  = {
    nodeDefinition: def.NodeDefinition
    key: string
    annotation: Annotation
}

export type SHTProp  = {
    propKey: string
    propDefinition: def.PropertyDefinition
    //annotation: Annotation
}

export type SHTClose<Annotation>  = {
    annotation: Annotation
}

export type VTClose<Annotation>  = {
    annotation: Annotation
}

export type VTOpen<Annotation>  = {
    nodeDefinition: def.NodeDefinition
    keyPropertyDefinition: def.PropertyDefinition | null
    annotation: Annotation
}

export type SHTOpen<Annotation>  = {
    nodeDefinition: def.NodeDefinition
    keyPropertyDefinition: def.PropertyDefinition | null
    annotation: Annotation
}


export type NodeHandler<Annotation> = h.NodeHandler2<
DictOpen<Annotation>,
DictClose<Annotation>,
null,
Entr<Annotation>,
LOpen<Annotation>,
LClose<Annotation>,
VProp<Annotation>,
SHTProp,
SHTOpen<Annotation>,
SHTClose<Annotation>,
TU<Annotation>,
Opt<Annotation>,
Val<Annotation>,
VTOpen<Annotation>,
VTClose<Annotation>
>

export type DictionaryHandler<Annotation> = h.DictionaryHandler2<
DictOpen<Annotation>,
DictClose<Annotation>,
null,
Entr<Annotation>,
LOpen<Annotation>,
LClose<Annotation>,
VProp<Annotation>,
SHTProp,
SHTOpen<Annotation>,
SHTClose<Annotation>,
TU<Annotation>,
Opt<Annotation>,
Val<Annotation>,
VTOpen<Annotation>,
VTClose<Annotation>
>
export type ListHandler<Annotation> = h.ListHandler2<
DictOpen<Annotation>,
DictClose<Annotation>,
null,
Entr<Annotation>,
LOpen<Annotation>,
LClose<Annotation>,
VProp<Annotation>,
SHTProp,
SHTOpen<Annotation>,
SHTClose<Annotation>,
TU<Annotation>,
Opt<Annotation>,
Val<Annotation>,
VTOpen<Annotation>,
VTClose<Annotation>
>
export type TypeHandler<Annotation> = h.TypeHandler2<
DictOpen<Annotation>,
DictClose<Annotation>,
null,
Entr<Annotation>,
LOpen<Annotation>,
LClose<Annotation>,
VProp<Annotation>,
SHTProp,
SHTOpen<Annotation>,
SHTClose<Annotation>,
TU<Annotation>,
Opt<Annotation>,
Val<Annotation>,
VTOpen<Annotation>,
VTClose<Annotation>
>
export type ShorthandTypeHandler<Annotation> = h.ShorthandTypeHandler2<
DictOpen<Annotation>,
DictClose<Annotation>,
null,
Entr<Annotation>,
LOpen<Annotation>,
LClose<Annotation>,
VProp<Annotation>,
SHTProp,
SHTOpen<Annotation>,
SHTClose<Annotation>,
TU<Annotation>,
Opt<Annotation>,
Val<Annotation>,
VTOpen<Annotation>,
VTClose<Annotation>
>
export type PropertyHandler<Annotation> = h.PropertyHandler2<
DictOpen<Annotation>,
DictClose<Annotation>,
null,
Entr<Annotation>,
LOpen<Annotation>,
LClose<Annotation>,
VProp<Annotation>,
SHTProp,
SHTOpen<Annotation>,
SHTClose<Annotation>,
TU<Annotation>,
Opt<Annotation>,
Val<Annotation>,
VTOpen<Annotation>,
VTClose<Annotation>
>
export type TaggedUnionHandler<Annotation> = h.TaggedUnionHandler2<
DictOpen<Annotation>,
DictClose<Annotation>,
null,
Entr<Annotation>,
LOpen<Annotation>,
LClose<Annotation>,
VProp<Annotation>,
SHTProp,
SHTOpen<Annotation>,
SHTClose<Annotation>,
TU<Annotation>,
Opt<Annotation>,
Val<Annotation>,
VTOpen<Annotation>,
VTClose<Annotation>
>
export type RootHandler<Annotation> = h.RootHandler2<
DictOpen<Annotation>,
DictClose<Annotation>,
null,
Entr<Annotation>,
LOpen<Annotation>,
LClose<Annotation>,
VProp<Annotation>,
SHTProp,
SHTOpen<Annotation>,
SHTClose<Annotation>,
TU<Annotation>,
Opt<Annotation>,
Val<Annotation>,
VTOpen<Annotation>,
VTClose<Annotation>
>