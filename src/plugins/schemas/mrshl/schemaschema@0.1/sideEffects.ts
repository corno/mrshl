/* eslint
    "max-classes-per-file": off,
*/

import * as t from "./types"
import * as db5api from "../../../../db5api"
import { DiagnosticSeverity } from "../../../../etc/interfaces/DiagnosticSeverity"

export * from "./types"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

function createDictionary<Annotation>(
    _definition: t.Dictionary,
    collectionDefinition: t.Collection,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): db5api.DictionaryHandler<Annotation> {
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
): db5api.ListHandler<Annotation> {
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
): db5api.StateGroupHandler<Annotation> {
    return {
        onState: $ => {
            const state = definition.states.getUnsafe($.data.option)
            return createNode(state.node, onError)
        },
        onUnexpectedState: () => {
            //
        },
    }
}

function createProp<Annotation>(
    name: string,
    nodedefinition: t.Node,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): db5api.PropertyHandler<Annotation> {
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
        onStateGroup: () => {

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
        onScalarValue: $ => {
            const prop = nodedefinition.properties.getUnsafe(name)
            if (prop.type[0] !== "value") {
                throw new Error("unexpected")
            }
            const $$ = prop.type[1]

            switch ($$.type[0]) {
                case "boolean": {
                    if ($.data.type[0] !== "nonwrapped") {
                        onError(`expected a boolean, found a quoted string`, $.annotation, DiagnosticSeverity.error)
                    } else {
                        const val = $.data.type[1].value
                        if (val !== "true" && val !== "false") {
                            onError(`value '${val}' is not a boolean`, $.annotation, DiagnosticSeverity.error)
                        }
                    }
                    break
                }
                case "number": {
                    if ($.data.type[0] !== "nonwrapped") {
                        onError(`expected a number, found a wrapped string`, $.annotation, DiagnosticSeverity.error)
                    } else {
                        const val = $.data.type[1].value
                        //eslint-disable-next-line no-new-wrappers
                        if (isNaN(new Number(val).valueOf())) {
                            onError(`value '${val}' is not a number`, $.annotation, DiagnosticSeverity.error)
                        }
                    }
                    break
                }
                case "string": {
                    if ($.data.type[0] === "nonwrapped") {
                        onError(`expected a quoted string or a multiline string`, $.annotation, DiagnosticSeverity.error)
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
): db5api.ShorthandTypeHandler<Annotation> {
    return {
        onProperty: $ => {
            return createProp($.propKey, definition, onError)
        },
        onShorthandTypeClose: () => {
            //
        },
    }
}

function createType<Annotation>(
    definition: t.Node,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): db5api.TypeHandler<Annotation> {
    return {
        onProperty: $ => {
            return createProp($.data.key, definition, onError)
        },
        onUnexpectedProperty: () => {
            //
        },
        onTypeClose: () => {
            //
        },
    }
}

function createNode<Annotation>(
    definition: t.Node,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
): db5api.NodeHandler<Annotation> {
    return {
        onShorthandTypeOpen: () => {
            return createShorthandType(definition, onError)
        },
        onTypeOpen: () => {
            return createType(definition, onError)
        },
    }
}

export function createRoot<Annotation>(
    schema: t.Schema,
    onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void
): db5api.RootHandler<Annotation> {
    return {
        node: createNode(schema["root type"].get().node, onError),
        onEnd: () => {
            //
        },
    }
}