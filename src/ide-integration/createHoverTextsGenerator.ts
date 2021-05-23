/* eslint
    "max-classes-per-file": off,
*/

import * as sideEffects from "../API/ParsingSideEffectsAPI"
import * as syncAPI from "../API/syncAPI"
import * as astn from "astn"
import * as fp from "fountain-pen"
import * as md from "../API/types"

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

function createHoverTextsForNode(node: md.Node, keyProperty: md.Property | null): fp.InlineSegment {
    return [
        '(',
        () => {
            return createHoverTextsForProperties(node, keyProperty)
        },
        ')',
    ]
}

export type OnTokenHoverText = (
    range: astn.Range,
    getHoverTexts: GetHoverText | null,
) => void

class HoverTextGenerator implements sideEffects.Root {
    public readonly node: sideEffects.Node
    private readonly onEndCallback: () => void
    constructor(
        onToken: OnTokenHoverText,
        onEnd: () => void,
    ) {
        this.node = new NodeHoverTextGenerator(null, onToken)
        this.onEndCallback = onEnd
    }
    onEnd() {
        this.onEndCallback()
    }
}

class StateGroupHoverTextGenerator implements sideEffects.StateGroup {
    private readonly onToken: OnTokenHoverText
    private readonly name: string
    constructor(
        name: string,
        onToken: OnTokenHoverText,
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
        return new NodeHoverTextGenerator(null, this.onToken)
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
    private readonly onToken: OnTokenHoverText
    private readonly name: string
    constructor(
        name: string,
        onToken: OnTokenHoverText,
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
        return new NodeHoverTextGenerator(this.name, this.onToken)
    }
}

class ListHoverTextGenerator implements sideEffects.List {
    private readonly onToken: OnTokenHoverText
    private readonly name: string
    constructor(
        name: string,
        onToken: OnTokenHoverText,
    ) {
        this.name = name
        this.onToken = onToken
    }
    onClose(range: astn.Range) {
        this.onToken(range, () => {
            return this.name
        })
    }
    onEntry() {
        return new NodeHoverTextGenerator(null, this.onToken)
    }
    onUnexpectedEntry() {
        //
    }
}

class DictionaryHoverTextGenerator implements sideEffects.Dictionary {
    private readonly onToken: OnTokenHoverText
    private readonly name: string
    constructor(
        name: string,
        onToken: OnTokenHoverText,
    ) {
        this.name = name
        this.onToken = onToken
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
        return new NodeHoverTextGenerator(null, this.onToken)
    }
}

class ShorthandTypeHoverTextGenerator implements sideEffects.ShorthandType {
    private readonly onToken: OnTokenHoverText
    private readonly componentName: string | null
    constructor(
        componentName: string | null,
        onToken: OnTokenHoverText,
    ) {
        this.onToken = onToken
        this.componentName = componentName
    }
    private addOnToken(range: astn.Range) {

        if (this.componentName !== null) {
            const cn = this.componentName
            this.onToken(range, () => {
                return cn
            })
        }
        //
    }
    onProperty(
        propKey: string,
        _propDefinition: md.Property,
        _nodeBuilder: syncAPI.Node,
    ) {
        return new PropertyHoverTextGenerator(propKey, this.onToken)
    }
    onShorthandTypeClose(range: astn.Range) {
        this.addOnToken(range)
    }
}

class NodeHoverTextGenerator implements sideEffects.Node {
    private readonly onToken: OnTokenHoverText
    private readonly componentName: string | null
    constructor(
        componentName: string | null,
        onToken: OnTokenHoverText,
    ) {
        this.onToken = onToken
        this.componentName = componentName
    }
    private addOnToken(range: astn.Range) {

        if (this.componentName !== null) {
            const cn = this.componentName
            this.onToken(range, () => {
                return cn
            })
        }
        //
    }
    onShorthandTypeOpen(range: astn.Range) {
        this.addOnToken(range)
        return new ShorthandTypeHoverTextGenerator(this.componentName, this.onToken)
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
        range: astn.Range,
        _nodeDefinition: md.Node,
        _keyPropertyDefinition: md.Property | null
    ) {
        this.addOnToken(range)
        return new NodeHoverTextGenerator(this.componentName, this.onToken)
    }
    onTypeClose(range: astn.Range) {
        this.addOnToken(range)
    }
}

export function createHoverTextsGenerator(
    onToken: OnTokenHoverText,
    onEnd: () => void,
): sideEffects.Root {
    return new HoverTextGenerator(onToken, onEnd)
}