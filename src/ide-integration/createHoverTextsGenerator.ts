/* eslint
    "max-classes-per-file": off,
*/

import * as db5api from "../db5api"
import * as fp from "fountain-pen"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type GetHoverText = () => string

function createPropertyHoverText(prop: db5api.PropertyDefinition): fp.InlineSegment {
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

function createHoverTextsForProperties(node: db5api.NodeDefinition, keyProperty: db5api.PropertyDefinition | null): fp.Block {
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

function createHoverTextsForNode(node: db5api.NodeDefinition, keyProperty: db5api.PropertyDefinition | null): fp.InlineSegment {
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
): db5api.RootHandler<Annotation> {
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
): db5api.StateGroupHandler<Annotation> {

    return {
        onState: $ => {
            onToken($.annotation, () => {
                return name
            })
            return createNodeHoverTextGenerator(null, onToken)
        },
        onUnexpectedState: () => {
            //
        },
    }

}

function createPropertyHoverTextGenerator<Annotation>(

    name: string,
    onToken: OnTokenHoverText<Annotation>,
): db5api.PropertyHandler<Annotation> {
    return {

        onDictionary: $ => {
            onToken($.annotation, () => {
                return name
            })
            return createDictionaryHoverTextGenerator(name, onToken)
        },
        onList: $ => {
            onToken($.annotation, () => {
                return name
            })
            return createListHoverTextGenerator(name, onToken)
        },
        onStateGroup: $ => {
            onToken($.annotation, () => {
                return name
            })
            return createStateGroupHoverTextGenerator(name, onToken)
        },
        onNull: $ => {
            onToken($.annotation, () => {
                return name
            })
        },
        onScalarValue: $ => {
            onToken($.annotation, () => {
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
): db5api.ListHandler<Annotation> {
    return {

        onClose: $ => {
            onToken($.annotation, () => {
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
): db5api.DictionaryHandler<Annotation> {
    return {
        onClose: $ => {
            onToken($.annotation, () => {
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
): db5api.ShorthandTypeHandler<Annotation> {
    return {
        onProperty: $ => {
            return createPropertyHoverTextGenerator($.propKey, onToken)
        },
        onShorthandTypeClose: $ => {
            if (componentName !== null) {
                const cn = componentName
                onToken($.annotation, () => {
                    return cn
                })
            }
        },
    }
}

function createNodeHoverTextGenerator<Annotation>(
    componentName: string | null,
    onToken: OnTokenHoverText<Annotation>,
): db5api.NodeHandler<Annotation> {

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
            addOnToken($.annotation)
            return createShorthandTypeHoverTextGenerator(componentName, onToken)
        },
        onTypeOpen: $ => {
            addOnToken($.annotation)
            return createTypeHoverTextGenerator(componentName, onToken)
        },
    }
}


function createTypeHoverTextGenerator<Annotation>(
    componentName: string | null,
    onToken: OnTokenHoverText<Annotation>,
): db5api.TypeHandler<Annotation> {
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
        onProperty: $ => {
            return createPropertyHoverTextGenerator($.data.key, onToken)
        },
        onUnexpectedProperty: () => {
            //
        },
        onTypeClose: $ => {
            addOnToken($.annotation)
        },
    }
}

export function createHoverTextsGenerator<Annotation>(
    onToken: OnTokenHoverText<Annotation>,
    onEnd: () => void,
): db5api.RootHandler<Annotation> {
    return createHoverTextGenerator(onToken, onEnd)
}