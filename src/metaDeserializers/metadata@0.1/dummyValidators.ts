import * as validators from "../../deserialize/api"

/* eslint
    max-classes-per-file: "off",
*/

export class DummyCollectionValidator implements validators.CollectionValidator {
    public createEntry() {
        return new DummyEntryValidator()
    }
}

export class DummyComponentValidator implements validators.ComponentValidator {
    public readonly node = new DummyNodeValidator()
}

export class DummyEntryValidator implements validators.EntryValidator {
    public readonly node = new DummyNodeValidator()
    public insert() {
        //
    }
}

export class DummyNodeValidator implements validators.NodeValidator {
    public setCollection(_name: string) {
        return new DummyCollectionValidator()
    }
    public setComponent(_name: string) {
        return new DummyComponentValidator()
    }
    public setStateGroup(_name: string, _stateName: string) {
        return new DummyStateValidator()
    }
    public setSimpleValue(_name: string, _value: string) {
        //

    }
}

export class DummyStateValidator {
    public readonly node = new DummyNodeValidator()
}

export function createNodeValidator() {
    return new DummyNodeValidator()
}