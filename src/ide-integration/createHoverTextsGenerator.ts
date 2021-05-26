/* eslint
    "max-classes-per-file": off,
*/

import * as sideEffects from "../API/ParsingSideEffectsAPI"
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

export type OnTokenHoverText<Annotation> = (
    annotation: Annotation,
    getHoverTexts: GetHoverText | null,
) => void

class HoverTextGenerator<Annotation> implements sideEffects.Root<Annotation> {
    public readonly node: sideEffects.Node<Annotation>
    private readonly onEndCallback: () => void
    constructor(
        onToken: OnTokenHoverText<Annotation>,
        onEnd: () => void,
    ) {
        this.node = new NodeHoverTextGenerator(null, onToken)
        this.onEndCallback = onEnd
    }
    onEnd() {
        this.onEndCallback()
    }
}

class StateGroupHoverTextGenerator<Annotation> implements sideEffects.StateGroup<Annotation>{
    private readonly onToken: OnTokenHoverText<Annotation>
    private readonly name: string
    constructor(
        name: string,
        onToken: OnTokenHoverText<Annotation>,
    ) {
        this.name = name
        this.onToken = onToken
    }
    onState(
        optionData: astn.OptionData<Annotation>,
    ) {
        this.onToken(optionData.annotation, () => {
            return this.name
        })
        return new NodeHoverTextGenerator(null, this.onToken)
    }
    onUnexpectedState(
        // _stateName: string,
        // _tuRange: astn.Range,
        // _tuPreData: astn.ContextData,
        // _optionRange: astn.Range,
        // _optionPreData: astn.ContextData,
        // _stateGroupDefinition: md.StateGroup
    ) {
        //
    }
}

class PropertyHoverTextGenerator<Annotation> implements sideEffects.Property<Annotation> {
    private readonly onToken: OnTokenHoverText<Annotation>
    private readonly name: string
    constructor(
        name: string,
        onToken: OnTokenHoverText<Annotation>,
    ) {
        this.name = name
        this.onToken = onToken
    }
    onDictionary(
        data: astn.ObjectBeginData<Annotation>
    ) {
        this.onToken(data.annotation, () => {
            return this.name
        })
        return new DictionaryHoverTextGenerator(this.name, this.onToken)
    }
    onList(
        data: astn.ArrayBeginData<Annotation>
    ) {
        this.onToken(data.annotation, () => {
            return this.name
        })
        return new ListHoverTextGenerator(this.name, this.onToken)
    }
    onStateGroup(
        data: astn.TaggedUnionData<Annotation>
    ) {
        this.onToken(data.annotation, () => {
            return this.name
        })
        return new StateGroupHoverTextGenerator(this.name, this.onToken)
    }
    onNull(
        data: astn.SimpleValueData2<Annotation>
    ) {
        this.onToken(data.annotation, () => {
            return this.name
        })
    }
    onValue(
        data: astn.SimpleValueData2<Annotation>
        // _syncValue: syncAPI.Value,
        // range: astn.Range,
        // _data: astn.SimpleValueData,
        // _definition: md.Value,
    ) {
        this.onToken(data.annotation, () => {
            return this.name
        })
    }
    onComponent() {
        return new NodeHoverTextGenerator(this.name, this.onToken)
    }
}

class ListHoverTextGenerator<Annotation> implements sideEffects.List<Annotation> {
    private readonly onToken: OnTokenHoverText<Annotation>
    private readonly name: string
    constructor(
        name: string,
        onToken: OnTokenHoverText<Annotation>,
    ) {
        this.name = name
        this.onToken = onToken
    }
    onClose(
        data: astn.ArrayEndData<Annotation>
    ) {
        this.onToken(data.annotation, () => {
            return this.name
        })
    }
    onEntry() {
        return new NodeHoverTextGenerator(null, this.onToken)
    }
}

class DictionaryHoverTextGenerator<Annotation> implements sideEffects.Dictionary<Annotation> {
    private readonly onToken: OnTokenHoverText<Annotation>
    private readonly name: string
    constructor(
        name: string,
        onToken: OnTokenHoverText<Annotation>,
    ) {
        this.name = name
        this.onToken = onToken
    }
    onClose(
        data: astn.ObjectEndData<Annotation>
    ) {
        this.onToken(data.annotation, () => {
            return this.name
        })
    }
    onEntry(
        // _range: astn.Range,
        // _nodeDefinition: md.Node,
        // _keyPropertyDefinition: md.Property,
    ) {
        return new NodeHoverTextGenerator(null, this.onToken)
    }
}

class ShorthandTypeHoverTextGenerator<Annotation> implements sideEffects.ShorthandType<Annotation> {
    private readonly onToken: OnTokenHoverText<Annotation>
    private readonly componentName: string | null
    constructor(
        componentName: string | null,
        onToken: OnTokenHoverText<Annotation>,
    ) {
        this.onToken = onToken
        this.componentName = componentName
    }
    private addOnToken(annotation: Annotation) {

        if (this.componentName !== null) {
            const cn = this.componentName
            this.onToken(annotation, () => {
                return cn
            })
        }
        //
    }
    onProperty(
        propKey: string,
        // _data: astn.PropertyData<Annotation>,
        // _propDefinition: md.Property,
        // _nodeBuilder: syncAPI.Node,
    ) {
        return new PropertyHoverTextGenerator(propKey, this.onToken)
    }
    onShorthandTypeClose(
        data: astn.ArrayEndData<Annotation>
    ) {
        this.addOnToken(data.annotation)
    }
}

class NodeHoverTextGenerator<Annotation> implements sideEffects.Node<Annotation> {
    private readonly onToken: OnTokenHoverText<Annotation>
    private readonly componentName: string | null
    constructor(
        componentName: string | null,
        onToken: OnTokenHoverText<Annotation>,
    ) {
        this.onToken = onToken
        this.componentName = componentName
    }
    private addOnToken(annotation: Annotation) {

        if (this.componentName !== null) {
            const cn = this.componentName
            this.onToken(annotation, () => {
                return cn
            })
        }
        //
    }
    onShorthandTypeOpen(
        data: astn.ArrayBeginData<Annotation>
    ) {
        this.addOnToken(data.annotation)
        return new ShorthandTypeHoverTextGenerator(this.componentName, this.onToken)
    }
    onProperty(
        data: astn.PropertyData<Annotation>
        // propKey: string,
        // _propRange: astn.Range,
        // _propDefinition: md.Property,
        // _nodeBuilder: syncAPI.Node,
    ) {
        return new PropertyHoverTextGenerator(data.key, this.onToken)
    }
    onUnexpectedProperty(
        // _key: string,
        // _range: astn.Range,
        // _preData: astn.ContextData,
        // _expectedProperties: string[]
    ) {
        //
    }
    onTypeOpen(
        data: astn.ObjectBeginData<Annotation>
        // range: astn.Range,
        // _nodeDefinition: md.Node,
        // _keyPropertyDefinition: md.Property | null
    ) {
        this.addOnToken(data.annotation)
        return new NodeHoverTextGenerator(this.componentName, this.onToken)
    }
    onTypeClose(
        data: astn.ObjectEndData<Annotation>
    ) {
        this.addOnToken(data.annotation)
    }
}

export function createHoverTextsGenerator<Annotation>(
    onToken: OnTokenHoverText<Annotation>,
    onEnd: () => void,
): sideEffects.Root<Annotation> {
    return new HoverTextGenerator(onToken, onEnd)
}