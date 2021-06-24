/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../deserialize/interfaces/streamingValidationAPI"
import * as def from "../deserialize/interfaces/typedParserDefinitions"
import * as fp from "fountain-pen"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type GetHoverText = () => string

function createPropertyHoverText(prop: def.PropertyDefinition): fp.InlineSegment {
    switch (prop.type[0]) {
        case "dictionary": {
            return `{}`
        }
        case "list": {
            return `[]`
        }
        case "component": {
            const $ = prop.type[1]

            return createHoverTextsForNode($.type.get().node, null)
        }
        case "tagged union": {
            const $ = prop.type[1]
            return [
                `| '${$["default option"].name}' `,
                createHoverTextsForNode($["default option"].get().node, null),
            ]
        }
        case "string": {
            const $ = prop.type[1]
            if ($.quoted) {
                return `"${$["default value"]}"`
            } else {
                return `${$["default value"]}`

            }
        }
        default:
            return assertUnreachable(prop.type[0])
    }
}

function createHoverTextsForProperties(node: def.NodeDefinition, keyProperty: def.PropertyDefinition | null): fp.Block {
    const x: fp.Block[] = []
    node.properties.forEach((prop, propKey) => {
        if (prop === keyProperty) {
            return
        }
        x.push(fp.line([
            `'${propKey}': `,
            createPropertyHoverText(prop),
        ]))
    })
    return x
}

function createHoverTextsForNode(node: def.NodeDefinition, keyProperty: def.PropertyDefinition | null): fp.InlineSegment {
    return [
        '(',
        () => {
            return createHoverTextsForProperties(node, keyProperty)
        },
        ')',
    ]
}

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
): streamVal.TaggedUnionHandler<Annotation> {

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
): streamVal.ValueHandler<Annotation> {
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