import * as builders from "../../builderAPI"

/* eslint
    max-classes-per-file: "off",
*/

export class CollectionBuilder implements builders.CollectionBuilder {
    public createEntry() {
        return new EntryBuilder()
    }
}

export class ComponentBuilder implements builders.ComponentBuilder {
    public readonly node = new NodeBuilder()
}

export class EntryBuilder implements builders.EntryBuilder {
    public readonly node = new NodeBuilder()
    public insert() {
        //
    }
}

export class NodeBuilder implements builders.NodeBuilder {
    public setCollection(_name: string) {
        return new CollectionBuilder()
    }
    public setComponent(_name: string) {
        return new ComponentBuilder()
    }
    public setStateGroup(_name: string, _stateName: string) {
        return new StateBuilder()
    }
    public setSimpleValue(_name: string, _value: string) {
        return new ValueBuilder()

    }
}

export class StateBuilder {
    public readonly node = new NodeBuilder()
}

export class ValueBuilder implements builders.ValueBuilder {
    getSuggestions() {
        return []
    }
}

export function createNodeBuilder() {
    return new NodeBuilder()
}