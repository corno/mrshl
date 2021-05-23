/* eslint
    "max-classes-per-file": off,
*/

import * as sideEffects from "../API/ParsingSideEffectsAPI"

export function createNOPSideEffects(): sideEffects.Root {
    return new NOPSideEffects()
}

class NOPSideEffects implements sideEffects.Root {
    node: sideEffects.Node
    constructor() {
        this.node = new NodeNOPSideEffects()
    }
    onEnd() {
        //
    }
}

class NodeNOPSideEffects implements sideEffects.Node {
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

class ShorthandTypeNOPSideEffects implements sideEffects.ShorthandType {
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

class StateGroupNOPSideEffects implements sideEffects.StateGroup {
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

class PropertyNOPSideEffects implements sideEffects.Property {
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
    onValue() {
        //
    }
    onNull() {
        //
    }
    onComponent() {
        return new NodeNOPSideEffects()
    }
}

class DictionaryNOPSideEffects implements sideEffects.Dictionary {
    constructor() {
        //
    }
    onClose() {
        //
    }
    onUnexpectedEntry() {
        //
    }
    onEntry() {
        return new NodeNOPSideEffects()
    }
}

class ListNOPSideEffects implements sideEffects.List {
    constructor() {
        //
    }
    onClose() {
        //
    }
    onEntry() {
        return new NodeNOPSideEffects()
    }
    onUnexpectedEntry() {
        //
    }
}