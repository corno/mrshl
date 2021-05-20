/* eslint
    "max-classes-per-file": off,
*/

import * as sideEffects from "../ParsingSideEffectsAPI"
import * as syncAPI from "../syncAPI"
import * as astn from "astn"
import * as fp from "fountain-pen"
import * as md from "../types"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type GetHoverText = () => string

function createPropertyHoverText(prop: md.Property): fp.InlineSegment {
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

function createHoverTextsForProperties(node: md.Node, keyProperty: md.Property | null): fp.Block {
    const x: fp.Block[] = []
    node.properties.mapUnsorted((prop, propKey) => {
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

function createHoverTextsForNode(node: md.Node, keyProperty: md.Property | null): fp.InlineSegment {
    return [
        '(',
        () => {
            return createHoverTextsForProperties(node, keyProperty)
        },
        ')',
    ]
}

export type OnToken = (
    range: astn.Range,
    getHoverTexts: GetHoverText | null,
) => void

class HoverTextGenerator implements sideEffects.Root {
    public readonly node: sideEffects.Node
    private readonly onEndCallback: () => void
    constructor(
        onToken: OnToken,
        onEnd: () => void,
    ) {
        this.node = new NodeHoverTextGenerator(onToken)
        this.onEndCallback = onEnd
    }
    onEnd() {
        this.onEndCallback()
    }
}

class StateGroupHoverTextGenerator implements sideEffects.StateGroup {
    private readonly onToken: OnToken
    private readonly name: string
    constructor(
        name: string,
        onToken: OnToken,
    ) {
        this.name = name
        this.onToken = onToken
    }
    onState(
        _stateName: string,
        tuRange: astn.Range,
        _beginPreData: astn.ContextData,
        optionRange: astn.Range,
        _optionPreData: astn.ContextData

    ) {
        this.onToken(tuRange, () => {
            return this.name
        })
        this.onToken(optionRange, () => {
            return this.name
        })
        return new NodeHoverTextGenerator(this.onToken)
    }
    onUnexpectedState(
        _stateName: string,
        _tuRange: astn.Range,
        _tuPreData: astn.ContextData,
        _optionRange: astn.Range,
        _optionPreData: astn.ContextData,
        _stateGroupDefinition: md.StateGroup
    ) {
        //
    }
}

class PropertyHoverTextGenerator implements sideEffects.Property {
    private readonly onToken: OnToken
    private readonly name: string
    constructor(
        name: string,
        onToken: OnToken,
    ) {
        this.name = name
        this.onToken = onToken
    }
    onDictionary(range: astn.Range) {
        this.onToken(range, () => {
            return this.name
        })
        return new DictionaryHoverTextGenerator(this.name, this.onToken)
    }
    onList(range: astn.Range) {
        this.onToken(range, () => {
            return this.name
        })
        return new ListHoverTextGenerator(this.name, this.onToken)
    }
    onStateGroup() {
        return new StateGroupHoverTextGenerator(this.name, this.onToken)
    }
    onNull(range: astn.Range) {
        this.onToken(range, () => {
            return this.name
        })
    }
    onValue(
        _syncValue: syncAPI.Value,
        range: astn.Range,
        _data: astn.SimpleValueData,
        _definition: md.Value,
    ) {
        this.onToken(range, () => {
            return this.name
        })
    }
    onComponent() {
        return new NodeHoverTextGenerator(this.onToken)
    }
}

class ListHoverTextGenerator implements sideEffects.List {
    public readonly node: sideEffects.Node
    private readonly onToken: OnToken
    private readonly name: string
    constructor(
        name: string,
        onToken: OnToken,
    ) {
        this.name = name
        this.onToken = onToken
        this.node = new NodeHoverTextGenerator(onToken)
    }
    onClose(range: astn.Range) {
        this.onToken(range, () => {
            return this.name
        })
    }
    onEntry() {
        return new NodeHoverTextGenerator(this.onToken)
    }
    onUnexpectedEntry() {
        //
    }
}

class DictionaryHoverTextGenerator implements sideEffects.Dictionary {
    public readonly node: sideEffects.Node
    private readonly onToken: OnToken
    private readonly name: string
    constructor(
        name: string,
        onToken: OnToken,
    ) {
        this.name = name
        this.onToken = onToken
        this.node = new NodeHoverTextGenerator(onToken)
    }
    onClose(range: astn.Range) {
        this.onToken(range, () => {
            return this.name
        })
    }
    onUnexpectedEntry(
    ) {
        //
    }
    onEntry(
        _range: astn.Range,
        _nodeDefinition: md.Node,
        _keyPropertyDefinition: md.Property,
    ) {
        return new NodeHoverTextGenerator(this.onToken)
    }
}

class NodeHoverTextGenerator implements sideEffects.Node {
    private readonly onToken: OnToken
    constructor(
        onToken: OnToken,
    ) {
        this.onToken = onToken
    }
    onShorthandTypeClose() {
        //
    }
    onShorthandTypeOpen() {
        //
    }
    onProperty(
        propKey: string,
        _propRange: astn.Range,
        _propDefinition: md.Property,
        _nodeBuilder: syncAPI.Node,
    ) {
        return new PropertyHoverTextGenerator(propKey, this.onToken)
    }
    onUnexpectedProperty(
        _key: string,
        _range: astn.Range,
        _preData: astn.ContextData,
        _expectedProperties: string[]
    ) {
        //
    }
    onTypeOpen(
        _range: astn.Range,
        _nodeDefinition: md.Node,
        _keyPropertyDefinition: md.Property | null
    ) {
        //
    }
    onTypeClose() {
        //
    }
}

export function createHoverTextsGenerator(
    onToken: OnToken,
    onEnd: () => void,
): sideEffects.Root {
    return new HoverTextGenerator(onToken, onEnd)
}