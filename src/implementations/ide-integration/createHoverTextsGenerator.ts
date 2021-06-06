/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../../interfaces/streamingValidationAPI"
import * as fp from "fountain-pen"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type GetHoverText = () => string

function createPropertyHoverText(prop: streamVal.PropertyDefinition): fp.InlineSegment {
    switch (prop.type[0]) {
        case "collection": {
            const $ = prop.type[1]
            switch ($.type[0]) {
                case "dictionary": {
                    return `{}`
                }
                case "list": {
                    return `[]`
                }
                default:
                    return assertUnreachable($.type[0])
            }
        }
        case "component": {
            const $ = prop.type[1]

            return createHoverTextsForNode($.type.get().node, null)
        }
        case "state group": {
            const $ = prop.type[1]
            return [
                `| '${$["default state"].name}' `,
                createHoverTextsForNode($["default state"].get().node, null),
            ]
        }
        case "value": {
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

function createHoverTextsForProperties(node: streamVal.NodeDefinition, keyProperty: streamVal.PropertyDefinition | null): fp.Block {
    const x: fp.Block[] = []
    node.properties.mapSorted((prop, propKey) => {
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

function createHoverTextsForNode(node: streamVal.NodeDefinition, keyProperty: streamVal.PropertyDefinition | null): fp.InlineSegment {
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
        node: createNodeHoverTextGenerator(null, onToken),
        onEnd: () => {
            onEnd()
        },
    }
}

function createStateGroupHoverTextGenerator<Annotation>(

    name: string,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.TaggedUnionHandler<Annotation> {

    return {
        onOption: $ => {
            onToken($.annotation.annotation, () => {
                return name
            })
            return createNodeHoverTextGenerator(null, onToken)
        },
        // onUnexpectedOption: () => {
        //     //
        // },
    }

}

function createPropertyHoverTextGenerator<Annotation>(

    name: string,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.PropertyHandler<Annotation> {
    return {

        onDictionary: $ => {
            onToken($.annotation.annotation, () => {
                return name
            })
            return createDictionaryHoverTextGenerator(name, onToken)
        },
        onList: $ => {
            onToken($.annotation.annotation, () => {
                return name
            })
            return createListHoverTextGenerator(name, onToken)
        },
        onStateGroup: $ => {
            onToken($.annotation.annotation, () => {
                return name
            })
            return createStateGroupHoverTextGenerator(name, onToken)
        },
        onNull: () => {
            //FIXME
            // onToken($.annotation.annotation, () => {
            //     return name
            // })
        },
        onScalarValue: $ => {
            onToken($.annotation.annotation, () => {
                return name
            })
        },
        onComponent: () => {
            return createNodeHoverTextGenerator(name, onToken)
        },
    }
}

function createListHoverTextGenerator<Annotation>(
    name: string,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.ListHandler<Annotation> {
    return {

        onClose: $ => {
            onToken($.annotation.annotation, () => {
                return name
            })
        },
        onEntry: () => {
            return createNodeHoverTextGenerator(null, onToken)
        },
    }
}

function createDictionaryHoverTextGenerator<Annotation>(
    name: string,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.DictionaryHandler<Annotation> {
    return {
        onClose: $ => {
            onToken($.annotation.annotation, () => {
                return name
            })
        },
        onEntry: () => {
            return createNodeHoverTextGenerator(null, onToken)
        },
    }
}

function createShorthandTypeHoverTextGenerator<Annotation>(
    componentName: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.ShorthandTypeHandler<Annotation> {
    return {
        onProperty: $ => {
            return createPropertyHoverTextGenerator($.annotation.propKey, onToken)
        },
        onShorthandTypeClose: $ => {
            if (componentName !== null) {
                const cn = componentName
                onToken($.annotation.annotation, () => {
                    return cn
                })
            }
        },
    }
}

function createNodeHoverTextGenerator<Annotation>(
    componentName: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.NodeHandler<Annotation> {

    function addOnToken(annotation: Annotation) {

        if (componentName !== null) {
            const cn = componentName
            onToken(annotation, () => {
                return cn
            })
        }
        //
    }
    return {

        onShorthandTypeOpen: $ => {
            addOnToken($.annotation.annotation)
            return createShorthandTypeHoverTextGenerator(componentName, onToken)
        },
        onTypeOpen: $ => {
            addOnToken($.annotation.annotation)
            return createTypeHoverTextGenerator(componentName, onToken)
        },
    }
}


function createTypeHoverTextGenerator<Annotation>(
    componentName: string | null,
    onToken: OnTokenHoverText<Annotation>,
): streamVal.VerboseTypeHandler<Annotation> {
    return {
        onProperty: $ => {
            return createPropertyHoverTextGenerator($.data.key, onToken)
        },
        // onUnexpectedProperty: () => {
        //     //
        // },
        onTypeClose: $ => {
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