import * as builders from "../../../datasetAPI"
import * as types from "./types"
import * as md from "../../../metaDataSchema"
import { RawObject } from "./generics"

/* eslint
    max-classes-per-file: "off",
*/

function assertUnreachable(_x: never) {
    throw new Error("unreachable")
}

export class DictionaryBuilder implements builders.Dictionary {
    private readonly collectionDefinition: types.Collection
    private readonly dictionaryDefinition: types.Dictionary
    private readonly entries: DictionaryEntryBuilder[] = []
    public readonly definition: md.Dictionary
    constructor(
        collectionDefinition: types.Collection,
        dictionaryDefinition: types.Dictionary,
        publicDefinition: md.Dictionary,
    ) {
        this.collectionDefinition = collectionDefinition
        this.dictionaryDefinition = dictionaryDefinition
        this.definition = publicDefinition
    }
    public createEntry() {
        const de = new DictionaryEntryBuilder(
            this.collectionDefinition,
            this.dictionaryDefinition,
            this.definition,
        )
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: DictionaryEntryBuilder, key: string) => void) {
        this.entries.forEach(e => {
            const keyPropName = e.dictionaryDefinition["key property"].getName()
            callback(e, e.node.getValue(keyPropName).getValue())
        })
    }
}

export class ListBuilder implements builders.ListBuilder {
    private readonly collectionDefinition: types.Collection
    private readonly listDefinition: types.List
    public readonly definition: md.List
    private readonly entries: ListEntryBuilder[] = []

    constructor(
        collectionDefinition: types.Collection,
        listDefinition: types.List,
        publicDefinition: md.List,
    ) {
        this.collectionDefinition = collectionDefinition
        this.listDefinition = listDefinition
        this.definition = publicDefinition
    }
    public createEntry() {
        const de = new ListEntryBuilder(
            this.collectionDefinition,
            this.listDefinition,
            this.definition,
        )
        this.entries.push(de)
        return de
    }
    public forEachEntry(callback: (entry: ListEntryBuilder) => void) {
        this.entries.forEach(e => callback(e))
    }
}

export class ComponentBuilder implements builders.Component {
    //private readonly definition: types.Component
    public readonly node: NodeBuilder
    constructor(privateDefinition: types.Component, publicDefinition: md.Component) {
        //this.definition = definition
        this.node = new NodeBuilder(privateDefinition.type.get().node, publicDefinition.type.get().node)
    }
    public setComments() {
        //
    }
}

export class ListEntryBuilder implements builders.ListEntry {
    //private readonly collectionDefinition: types.Collection
    //private readonly listDefinition: types.List
    //private readonly onError: OnError
    public readonly node: NodeBuilder

    constructor(
        collectionDefinition: types.Collection,
        _listDefinition: types.List,
        publicDefinition: md.List
    ) {
        //this.collectionDefinition = collectionDefinition
        //this.listDefinition = listDefinition
        //this.onError = onError
        if (publicDefinition["has instances"][0] !== "yes") {
            throw new Error("Unexpected")
        }
        this.node = new NodeBuilder(collectionDefinition.node, publicDefinition["has instances"][1].node)
    }
    public setComments() {
        //
    }
}
export class DictionaryEntryBuilder implements builders.DictionaryEntry {
    //private readonly collectionDefinition: types.Collection
    //private readonly dictionaryDefinition: types.Dictionary
    //private readonly onError: OnError
    public readonly node: NodeBuilder
    public dictionaryDefinition: types.Dictionary

    constructor(
        collectionDefinition: types.Collection,
        dictionaryDefinition: types.Dictionary,
        publicDefinition: md.Dictionary,
    ) {
        //this.collectionDefinition = collectionDefinition
        //this.dictionaryDefinition = dictionaryDefinition
        //this.onError = onError
        if (publicDefinition["has instances"][0] !== "yes") {
            throw new Error("unexpected")
        }
        this.node = new NodeBuilder(collectionDefinition.node, publicDefinition["has instances"][1].node)
        this.dictionaryDefinition = dictionaryDefinition
    }
    public setComments() {
        //
    }
}

export class NodeBuilder implements builders.NodeBuilder {
    private readonly definition: types.Node
    private readonly dictionaries: RawObject<DictionaryBuilder> = {}
    private readonly lists: RawObject<ListBuilder> = {}
    private readonly components: RawObject<ComponentBuilder> = {}
    private readonly stateGroups: RawObject<StateGroupBuilder> = {}
    private readonly values: RawObject<ValueBuilder> = {}
    constructor(privateDefinition: types.Node, publicDefinition: md.Node) {
        this.definition = privateDefinition
        this.definition.properties.forEach((p, pKey) => {
            const publicPropertyDefinition = publicDefinition.properties.get(pKey)
            if (publicPropertyDefinition === null) {
                throw new Error("Unexpected")
            }
            switch (p.type[0]) {
                case "collection": {
                    const $ = p.type[1]
                    if (publicPropertyDefinition.type[0] !== "collection") {
                        throw new Error("unexpected")
                    }
                    const publicCollectionDefinition = publicPropertyDefinition.type[1]

                    switch ($.type[0]) {
                        case "dictionary": {
                            if (publicCollectionDefinition.type[0] !== "dictionary") {
                                throw new Error("unexpected")
                            }
                            this.dictionaries[pKey] = new DictionaryBuilder($, $.type[1], publicCollectionDefinition.type[1])
                            break
                        }
                        case "list": {
                            if (publicCollectionDefinition.type[0] !== "list") {
                                throw new Error("unexpected")
                            }
                            this.lists[pKey] = new ListBuilder($, $.type[1], publicCollectionDefinition.type[1])
                            break
                        }
                        default:
                            assertUnreachable($.type[0])
                    }
                    break
                }
                case "component": {
                    if (publicPropertyDefinition.type[0] !== "component") {
                        throw new Error("unexpected")
                    }
                    this.components[pKey] = new ComponentBuilder(p.type[1], publicPropertyDefinition.type[1])
                    break
                }
                case "state group": {
                    if (publicPropertyDefinition.type[0] !== "state group") {
                        throw new Error("unexpected")
                    }
                    this.stateGroups[pKey] = new StateGroupBuilder(p.type[1], publicPropertyDefinition.type[1])
                    break
                }
                case "value": {
                    if (publicPropertyDefinition.type[0] !== "value") {
                        throw new Error("unexpected")
                    }
                    this.values[pKey] = new ValueBuilder(p.type[1], publicPropertyDefinition.type[1])
                    break
                }
                default:
                    assertUnreachable(p.type[0])
            }
        })
    }
    public getDictionary(name: string) {
        const p = this.dictionaries[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such dictionary: ${name}`)
        }
        return p
    }
    public getList(name: string) {
        const p = this.lists[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such list: ${name}`)
        }
        return p
    }
    public getComponent(name: string) {
        const p = this.components[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such component: ${name}`)
        }
        return p
    }
    public getStateGroup(name: string) {
        const p = this.stateGroups[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such state group: ${name}`)
        }
        return p
    }
    public getValue(name: string) {
        const p = this.values[name]
        if (p === undefined) {
            throw new Error(`UNEXPECTED: no such value: ${name}`)
        }
        return p
    }
}

export class ValueBuilder implements builders.Value {
    private readonly privateDefinition: types.Value
    public readonly definition: md.Value
    private value: string
    constructor(privateDefinition: types.Value, definition: md.Value) {
        this.privateDefinition = privateDefinition
        this.value = privateDefinition["default value"]
        this.definition = definition
    }
    public setComments() {
        //
    }
    public getSuggestions() {
        return []
    }
    public getValue(): string {
        return this.value
    }
    public setValue(value: string, onError: (message: string) => void) {
        const $ = this.privateDefinition
        switch ($.type[0]) {
            case "boolean": {
                if (value !== "true" && value !== "false") {
                    onError(`value '${value}' is not a boolean`)
                }
                break
            }
            case "number": {
                /* eslint no-new-wrappers: "off" */
                const nr = new Number(value).valueOf()
                if (isNaN(nr)) {
                    onError(`value '${value}' is not a number`)
                }
                break
            }
            case "string": {
                break
            }
            default:
                assertUnreachable($.type[0])
        }
        this.value = value
    }
}

export class StateGroupBuilder {
    private readonly privateDefinition: types.StateGroup
    public readonly definition: md.StateGroup
    private currentState: StateBuilder
    constructor(privateDefinition: types.StateGroup, publicDefinition: md.StateGroup) {
        this.privateDefinition = privateDefinition
        this.definition = publicDefinition
        this.currentState = new StateBuilder(
            privateDefinition["default state"].getName(),
            privateDefinition["default state"].get(),
            publicDefinition["default state"].get(),
        )
    }
    public setState(stateName: string) {
        const statePrivateDef = this.privateDefinition.states.get(stateName)
        const stateDef = this.definition.states.get(stateName)
        if (statePrivateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        if (stateDef === null) {
            throw new Error(`UNEXPECTED: no such state: ${stateName}`)
        }
        const state = new StateBuilder(stateName, statePrivateDef, stateDef)
        this.currentState = state
        return state
    }
    public setComments() {
        //
    }
    public getCurrentState(): StateBuilder {
        return this.currentState
    }
}


export class StateBuilder {
    //private readonly definition: types.State
    public readonly node: NodeBuilder
    private readonly stateName: string
    constructor(stateName: string, privateDefinition: types.State, publicDefinition: md.State) {
        //this.onError = onError
        //this.definition = definition
        this.node = new NodeBuilder(privateDefinition.node, publicDefinition.node)
        this.stateName = stateName
    }
    public setComments() {
        //
    }
    public getStateKey(): string {
        return this.stateName
    }
}

export class DatasetBuilder {
    public readonly schema: md.Schema
    public readonly root: NodeBuilder
    constructor(definition: types.Schema, metaDataSchema: md.Schema) {
        //this.onError = onError
        this.schema = metaDataSchema
        this.root = new NodeBuilder(definition["root type"].get().node, metaDataSchema["root type"].get().node)
    }
}
