/* eslint
    "max-classes-per-file": off,
*/

import * as astn from "astn"
import * as t from "./types"
import * as syncAPI from "../../../API/syncAPI"
import * as sideEffects from "../../../API/ParsingSideEffectsAPI"
import * as md from "../../../API/types"
import { DiagnosticSeverity } from "../../../API/DiagnosticSeverity"

export * from "./types"

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

class Dictionary<Annotation> implements sideEffects.Dictionary<Annotation> {
    private readonly collectionDefinition: t.Collection
    //private readonly definition: t.Dictionary
    private readonly onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void
    constructor(
        _definition: t.Dictionary,
        collectionDefinition: t.Collection,
        onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) {
        //this.definition = definition
        this.collectionDefinition = collectionDefinition
        this.onError = onError
    }
    onClose() {
        //
    }
    onEntry() {
        return new Node(this.collectionDefinition.node, this.onError)
    }
}

class List<Annotation> implements sideEffects.List<Annotation> {
    private readonly collectionDefinition: t.Collection
    //private readonly definition: t.List
    private readonly onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void

    constructor(
        _definition: t.List,
        collectionDefinition: t.Collection,
        onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) {
        //this.definition = definition
        this.collectionDefinition = collectionDefinition
        this.onError = onError
    }
    onEntry() {
        return new Node(this.collectionDefinition.node, this.onError)
    }
    onClose() {
        //
    }
}

export class Root<Annotation> implements sideEffects.Root<Annotation> {
    public readonly node: Node<Annotation>
    constructor(
        schema: t.Schema,
        onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void
    ) {
        this.node = new Node(schema["root type"].get().node, onError)
    }
    public onEnd(): void {
        //
    }
}

class StateGroup<Annotation> implements sideEffects.StateGroup<Annotation> {
    public readonly definition: t.StateGroup
    private readonly onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void

    constructor(
        definition: t.StateGroup,
        onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) {
        this.definition = definition
        this.onError = onError
    }
    onState(
        data: astn.OptionData<Annotation>
    ) {
        const state = this.definition.states.getUnsafe(data.option)
        return new Node(state.node, this.onError)
    }
    onUnexpectedState() {
        //
    }
}

class Prop<Annotation> implements sideEffects.Property<Annotation> {
    public readonly nodedefinition: t.Node
    public readonly name: string
    private readonly onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void

    constructor(
        name: string,
        nodedefinition: t.Node,
        onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) {
        this.name = name
        this.nodedefinition = nodedefinition
        this.onError = onError
    }
    onDictionary() {
        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "collection") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        if ($.type[0] !== "dictionary") {
            throw new Error("unexpected")
        }
        return new Dictionary($.type[1], $, this.onError)
    }
    onList() {
        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "collection") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        if ($.type[0] !== "list") {
            throw new Error("unexpected")
        }
        return new List($.type[1], $, this.onError)
    }
    onStateGroup() {

        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "state group") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        return new StateGroup($, this.onError)
    }
    onComponent() {
        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "component") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]
        return new Node($.type.get().node, this.onError)
    }
    onNull() {
        //
    }
    onValue(
        data: astn.SimpleValueData2<Annotation>,
        value: syncAPI.Value,
        _definition: md.Value
    ) {
        const prop = this.nodedefinition.properties.getUnsafe(this.name)
        if (prop.type[0] !== "value") {
            throw new Error("unexpected")
        }
        const $ = prop.type[1]

        const val = value.getValue()
        switch ($.type[0]) {
            case "boolean": {
                if (data.wrapper[0] !== "none") {
                    this.onError(`expected a boolean, found a quoted string`, data.annotation, DiagnosticSeverity.error)
                } else {
                    if (val !== "true" && val !== "false") {
                        this.onError(`value '${val}' is not a boolean`, data.annotation, DiagnosticSeverity.error)
                    }
                }
                break
            }
            case "number": {
                if (data.wrapper[0] !== "none") {
                    this.onError(`expected a number, found a quoted string`, data.annotation, DiagnosticSeverity.error)
                } else {
                    //eslint-disable-next-line no-new-wrappers
                    if (isNaN(new Number(val).valueOf())) {
                        this.onError(`value '${val}' is not a number`, data.annotation, DiagnosticSeverity.error)
                    }
                }
                break
            }
            case "string": {
                if (data.wrapper[0] === "none") {
                    this.onError(`expected a quoted string`, data.annotation, DiagnosticSeverity.error)
                }
                break
            }
            default:
                assertUnreachable($.type[0])
        }
    }
}

class ShorthandType<Annotation> implements sideEffects.ShorthandType<Annotation> {
    public readonly definition: t.Node
    private readonly onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void

    constructor(
        definition: t.Node,
        onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) {
        this.definition = definition
        this.onError = onError
    }
    onProperty(propKey: string) {
        return new Prop(propKey, this.definition, this.onError)
    }
    onShorthandTypeClose() {
        //
    }
}

class Node<Annotation> implements sideEffects.Node<Annotation> {
    public readonly definition: t.Node
    private readonly onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void

    constructor(
        definition: t.Node,
        onError: (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void,
    ) {
        this.definition = definition
        this.onError = onError
    }
    onShorthandTypeOpen() {
        return new ShorthandType(this.definition, this.onError)
    }
    onProperty(data: astn.PropertyData<Annotation>) {
        return new Prop(data.key, this.definition, this.onError)
    }
    onUnexpectedProperty() {
        //
    }
    onTypeOpen() {
        return new Node(this.definition, this.onError)
    }
    onTypeClose() {
        //
    }
}
