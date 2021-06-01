/* eslint
    "max-classes-per-file": off,
*/

import * as db5api from "../../../../db5api"

export function createNOPSideEffects<Annotation>(): db5api.RootHandler<Annotation> {
    return new NOPSideEffects()
}

class NOPSideEffects<Annotation> implements db5api.RootHandler<Annotation> {
    node: db5api.NodeHandler<Annotation>
    constructor() {
        this.node = new NodeNOPSideEffects()
    }
    onEnd() {
        //
    }
}

class NodeNOPSideEffects<Annotation> implements db5api.NodeHandler<Annotation> {
    constructor() {
        //
    }
    onShorthandTypeOpen() {
        return new ShorthandTypeNOPSideEffects()
    }
    onProperty() {
        return new PropertyNOPSideEffects()
    }
    onUnexpectedProperty() {
        //
    }
    onTypeOpen() {
        return new NodeNOPSideEffects()
    }
    onTypeClose() {
        //
    }
}

class ShorthandTypeNOPSideEffects<Annotation> implements db5api.ShorthandTypeHandler<Annotation> {
    constructor() {
        //
    }
    onShorthandTypeClose() {
        //
    }
    onProperty() {
        return new PropertyNOPSideEffects()
    }
}

class StateGroupNOPSideEffects<Annotation> implements db5api.StateGroupHandler<Annotation> {
    constructor() {
        //
    }
    onUnexpectedState() {
        //
    }
    onState() {
        return new NodeNOPSideEffects()
    }
}

class PropertyNOPSideEffects<Annotation> implements db5api.PropertyHandler<Annotation> {
    constructor() {
        //
    }
    onDictionary() {
        return new DictionaryNOPSideEffects()
    }
    onList() {
        return new ListNOPSideEffects()
    }
    onStateGroup() {
        return new StateGroupNOPSideEffects()
    }
    onScalarValue() {
        //
    }
    onNull() {
        //
    }
    onComponent() {
        return new NodeNOPSideEffects()
    }
}

class DictionaryNOPSideEffects<Annotation> implements db5api.DictionaryHandler<Annotation> {
    constructor() {
        //
    }
    onClose() {
        //
    }
    onEntry() {
        return new NodeNOPSideEffects()
    }
}

class ListNOPSideEffects<Annotation> implements db5api.ListHandler<Annotation> {
    constructor() {
        //
    }
    onClose() {
        //
    }
    onEntry() {
        return new NodeNOPSideEffects()
    }
}