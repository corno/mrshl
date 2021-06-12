/* eslint
    "max-classes-per-file": off,
*/

import * as t from "./types"
import * as streamVal from "../../../../interfaces/streamingValidationAPI"
import { DiagnosticSeverity } from "../../../../interfaces/DiagnosticSeverity"

export * from "./types"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function createDictionary<Annotation>(
    _definition: t.Dictionary,
    collectionDefinition: t.Collection,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): streamVal.DictionaryHandler<Annotation> {
    return {
        onClose: () => {
            //
        },
        onEntry: () => {
            return createNode(collectionDefinition.node, onError)
        },
    }
}

function createList<Annotation>(
    _definition: t.List,
    collectionDefinition: t.Collection,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): streamVal.ListHandler<Annotation> {
    return {
        onEntry: () => {
            return createNode(collectionDefinition.node, onError)
        },
        onClose: () => {
            //
        },
    }
}

function createStateGroup<Annotation>(
    definition: t.StateGroup,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): streamVal.TaggedUnionHandler<Annotation> {
    return {
        onUnexpectedOption: () => {
            //
        },
        onOption: $ => {
            const state = definition.states.getUnsafe($.data.option.value)
            return createNode(state.node, onError)
        },
        // onUnexpectedOption: () => {
        //     //
        // },
    }
}

function createProp<Annotation>(
    name: string,
    nodedefinition: t.Node,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): streamVal.PropertyHandler<Annotation> {
    return {
        onDictionary: () => {
            const prop = nodedefinition.properties.getUnsafe(name)
            if (prop.type[0] !== "collection") {
                throw new Error("unexpected")
            }
            const $ = prop.type[1]
            if ($.type[0] !== "dictionary") {
                throw new Error("unexpected")
            }
            return createDictionary($.type[1], $, onError)
        },
        onList: () => {
            const prop = nodedefinition.properties.getUnsafe(name)
            if (prop.type[0] !== "collection") {
                throw new Error("unexpected")
            }
            const $ = prop.type[1]
            if ($.type[0] !== "list") {
                throw new Error("unexpected")
            }
            return createList($.type[1], $, onError)
        },
        onTaggedUnion: () => {

            const prop = nodedefinition.properties.getUnsafe(name)
            if (prop.type[0] !== "state group") {
                throw new Error("unexpected")
            }
            const $ = prop.type[1]
            return createStateGroup($, onError)
        },
        onComponent: () => {
            const prop = nodedefinition.properties.getUnsafe(name)
            if (prop.type[0] !== "component") {
                throw new Error("unexpected")
            }
            const $ = prop.type[1]
            return createNode($.type.get().node, onError)
        },
        onNull: () => {
            //
        },
        onMultilineString: _$ => {
            const prop = nodedefinition.properties.getUnsafe(name)
            if (prop.type[0] !== "value") {
                throw new Error("unexpected")
            }
        },
        onSimpleString: $ => {
            const prop = nodedefinition.properties.getUnsafe(name)
            if (prop.type[0] !== "value") {
                throw new Error("unexpected")
            }
            const $$ = prop.type[1]

            switch ($$.type[0]) {
                case "boolean": {
                    if ($.data.wrapping[0] !== "none") {
                        onError(`expected a boolean, found a quoted string`, $.annotation.annotation, DiagnosticSeverity.error)
                    } else {
                        const val = $.data.value
                        if (val !== "true" && val !== "false") {
                            onError(`value '${val}' is not a boolean`, $.annotation.annotation, DiagnosticSeverity.error)
                        }
                    }
                    break
                }
                case "number": {
                    if ($.data.wrapping[0] !== "none") {
                        onError(`expected a number, found a wrapped string`, $.annotation.annotation, DiagnosticSeverity.error)
                    } else {
                        const val = $.data.value
                        //eslint-disable-next-line no-new-wrappers
                        if (isNaN(new Number(val).valueOf())) {
                            onError(`value '${val}' is not a number`, $.annotation.annotation, DiagnosticSeverity.error)
                        }
                    }
                    break
                }
                case "string": {
                    if ($.data.wrapping[0] === "none") {
                        onError(`expected a quoted string`, $.annotation.annotation, DiagnosticSeverity.error)
                    }
                    break
                }
                default:
                    assertUnreachable($$.type[0])
            }
        },
    }
}

function createShorthandType<Annotation>(
    definition: t.Node,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): streamVal.ShorthandTypeHandler<Annotation> {
    return {
        onProperty: $ => {
            return createProp($.annotation.propKey, definition, onError)
        },
        onShorthandTypeClose: () => {
            //
        },
    }
}

function createType<Annotation>(
    definition: t.Node,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): streamVal.VerboseTypeHandler<Annotation> {
    return {
        onUnexpectedProperty: () => {
            //
        },
        onProperty: $ => {
            return createProp($.data.key.value, definition, onError)
        },
        // onUnexpectedProperty: () => {
        //     //
        // },
        onVerboseTypeClose: () => {
            //
        },
    }
}

function createNode<Annotation>(
    definition: t.Node,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): streamVal.NodeHandler<Annotation> {
    return {
        onShorthandTypeOpen: () => {
            return createShorthandType(definition, onError)
        },
        onVerboseTypeOpen: () => {
            return createType(definition, onError)
        },
    }
}

export function createRoot<Annotation>(
    schema: t.Schema,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void
): streamVal.RootHandler<Annotation> {
    return {
        node: createNode(schema["root type"].get().node, onError),
        onEnd: () => {
            //
        },
    }
}