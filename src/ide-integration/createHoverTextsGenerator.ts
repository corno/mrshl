/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "astn-core"

type GetHoverText = () => string


export type OnTokenHoverText<Annotation> = (
    annotation: Annotation,
    getHoverTexts: GetHoverText | null,
) => void

function createHoverTextGenerator<Annotation>(
    onToken: OnTokenHoverText<Annotation>,
    onEnd: () => void,
): streamVal.RootHandler<Annotation> {
    return {
        root: createValueHoverTextGenerator(null, onToken),
        onEnd: () => {
            onEnd()
        },
    }
}

function createTaggedUnionHoverTextGenerator<Annotation>(

    name: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.TypedTaggedUnionHandler<Annotation> {

    return {
        onUnexpectedOption: () => {
            //
        },
        onOption: $ => {
            if (name !== null) {
                onToken($.annotation.annotation, () => {
                    return name
                })
            }
            return createValueHoverTextGenerator(null, onToken)
        },
        // onUnexpectedOption: () => {
        //     //
        // },
    }

}

function createValueHoverTextGenerator<Annotation>(
    name: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.TypedValueHandler<Annotation> {
    function addOnToken(annotation: Annotation) {
        if (name !== null) {
            const cn = name
            onToken(annotation, () => {
                return cn
            })
        }
        //
    }
    return {

        onDictionary: $ => {
            addOnToken($.annotation.annotation)
            return createDictionaryHoverTextGenerator(name, onToken)
        },
        onList: $ => {
            addOnToken($.annotation.annotation)
            return createListHoverTextGenerator(name, onToken)
        },
        onTaggedUnion: $ => {
            if ($.annotation.annotation !== null) {
                addOnToken($.annotation.annotation)
            }
            return createTaggedUnionHoverTextGenerator(name, onToken)
        },
        onNull: () => {
            //FIXME
            // onToken($.annotation.annotation, () => {
            //     return name
            // })
        },
        onSimpleString: $ => {
            addOnToken($.annotation.annotation)
        },
        onMultilineString: $ => {
            addOnToken($.annotation.annotation)
        },
        onComponent: () => {
            return createValueHoverTextGenerator(name, onToken)
        },
        onShorthandTypeOpen: $ => {
            if ($.annotation.annotation !== null) {
                addOnToken($.annotation.annotation)
            }
            return createShorthandTypeHoverTextGenerator(name, onToken)
        },
        onVerboseTypeOpen: $ => {
            function addOnToken(annotation: Annotation) {

                if (name !== null) {
                    const cn = name
                    onToken(annotation, () => {
                        return cn
                    })
                }
                //
            }
            addOnToken($.annotation.annotation)
            return createTypeHoverTextGenerator(name, onToken)
        },
    }
}

function createListHoverTextGenerator<Annotation>(
    name: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.ListHandler<Annotation> {
    return {

        onClose: $ => {
            if (name !== null) {
                onToken($.annotation.annotation, () => {
                    return name
                })
            }
        },
        onEntry: () => {
            return createValueHoverTextGenerator(null, onToken)
        },
    }
}

function createDictionaryHoverTextGenerator<Annotation>(
    name: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.DictionaryHandler<Annotation> {
    return {
        onClose: $ => {
            if (name !== null) {
                onToken($.annotation.annotation, () => {
                    return name
                })
            }
        },
        onEntry: () => {
            return createValueHoverTextGenerator(null, onToken)
        },
    }
}

function createShorthandTypeHoverTextGenerator<Annotation>(
    componentName: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.ShorthandTypeHandler<Annotation> {
    return {
        onProperty: $ => {
            return createValueHoverTextGenerator($.annotation.propKey, onToken)
        },
        onShorthandTypeClose: $ => {
            if (componentName !== null) {
                const cn = componentName
                if ($.annotation.annotation !== null) {
                    onToken($.annotation.annotation, () => {
                        return cn
                    })
                }
            }
        },
    }
}

function createTypeHoverTextGenerator<Annotation>(
    componentName: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.VerboseTypeHandler<Annotation> {
    return {
        onUnexpectedProperty: () => {
            //
        },
        onProperty: $ => {
            return createValueHoverTextGenerator($.data.keyString.value, onToken)
        },
        // onUnexpectedProperty: () => {
        //     //
        // },
        onVerboseTypeClose: $ => {
            if (componentName !== null) {
                const cn = componentName
                onToken($.annotation.annotation, () => {
                    return cn
                })
            }
        },
    }
}

export function createHoverTextsGenerator<Annotation>(
    onToken: OnTokenHoverText<Annotation>,
    onEnd: () => void,
): streamVal.RootHandler<Annotation> {
    return createHoverTextGenerator(onToken, onEnd)
}