/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../../../interfaces/streamingValidationAPI"

export function createNOPSideEffects<Annotation>(): streamVal.RootHandler<Annotation> {
    return new NOPSideEffects()
}

class NOPSideEffects<Annotation> implements streamVal.RootHandler<Annotation> {
    node: streamVal.NodeHandler<Annotation>
    constructor() {
        this.node = new NodeNOPSideEffects()
    }
    onEnd() {
        //
    }
}

class NodeNOPSideEffects<Annotation> implements streamVal.NodeHandler<Annotation> {
    constructor() {
        //
    }
    onShorthandTypeOpen() {
        return new ShorthandTypeNOPSideEffects()
    }
    onProperty() {
        return new PropertyNOPSideEffects()
    }
    // onUnexpectedProperty() {
    //     //
    // }
    onTypeOpen() {
        return new NodeNOPSideEffects()
    }
    onTypeClose() {
        //
    }
}

class ShorthandTypeNOPSideEffects<Annotation> implements streamVal.ShorthandTypeHandler<Annotation> {
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

class StateGroupNOPSideEffects<Annotation> implements streamVal.TaggedUnionHandler<Annotation> {
    constructor() {
        //
    }
    // onUnexpectedOption() {
    //     //
    // }
    onOption() {
        return new NodeNOPSideEffects()
    }
}

class PropertyNOPSideEffects<Annotation> implements streamVal.PropertyHandler<Annotation> {
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

class DictionaryNOPSideEffects<Annotation> implements streamVal.DictionaryHandler<Annotation> {
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

class ListNOPSideEffects<Annotation> implements streamVal.ListHandler<Annotation> {
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