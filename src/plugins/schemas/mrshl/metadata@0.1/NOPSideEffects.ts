/* eslint
    "max-classes-per-file": off,
*/

import * as sideEffects from "../../../../etc/interfaces/ParsingSideEffectsAPI"

export function createNOPSideEffects<Annotation>(): sideEffects.Root<Annotation> {
    return new NOPSideEffects()
}

class NOPSideEffects<Annotation> implements sideEffects.Root<Annotation> {
    node: sideEffects.Node<Annotation>
    constructor() {
        this.node = new NodeNOPSideEffects()
    }
    onEnd() {
        //
    }
}

class NodeNOPSideEffects<Annotation> implements sideEffects.Node<Annotation> {
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

class ShorthandTypeNOPSideEffects<Annotation> implements sideEffects.ShorthandType<Annotation> {
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

class StateGroupNOPSideEffects<Annotation> implements sideEffects.StateGroup<Annotation> {
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

class PropertyNOPSideEffects<Annotation> implements sideEffects.Property<Annotation> {
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

class DictionaryNOPSideEffects<Annotation> implements sideEffects.Dictionary<Annotation> {
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

class ListNOPSideEffects<Annotation> implements sideEffects.List<Annotation> {
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