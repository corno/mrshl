/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../../../../deserialize/interfaces/streamingValidationAPI"

export function createNOPSideEffects<Annotation>(): streamVal.RootHandler<Annotation> {
    return new NOPSideEffects()
}

class NOPSideEffects<Annotation> implements streamVal.RootHandler<Annotation> {
    root: streamVal.ValueHandler<Annotation>
    constructor() {
        this.root = createValueNOPSideEffects()
    }
    onEnd() {
        //
    }
}

function createValueNOPSideEffects<Annotation>(): streamVal.ValueHandler<Annotation> {
    return {
        onShorthandTypeOpen: () => {
            return new ShorthandTypeNOPSideEffects()
        },
        onVerboseTypeOpen: () => {
            return createVerboseTypeNOPSideEffects()
        },
        onDictionary: () => {
            return new DictionaryNOPSideEffects()
        },
        onList: () => {
            return new ListNOPSideEffects()
        },
        onTaggedUnion: () => {
            return new StateGroupNOPSideEffects()
        },
        onSimpleString: () => {
            //
        },
        onMultilineString: () => {
            //
        },
        onNull: () => {
            //
        },
        onComponent: () => {
            return createValueNOPSideEffects()
        },
    }
}

function createVerboseTypeNOPSideEffects<Annotation>(): streamVal.VerboseTypeHandler<Annotation> {
    return {
        onUnexpectedProperty: () => {
            //
        },
        onProperty: () => {
            return createValueNOPSideEffects()
        },
        // onUnexpectedProperty() {
        //     //
        // }
        onVerboseTypeClose: () => {
            //
        },
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
        return createValueNOPSideEffects()
    }
}

class StateGroupNOPSideEffects<Annotation> implements streamVal.TaggedUnionHandler<Annotation> {
    constructor() {
        //
    }
    // onUnexpectedOption() {
    //     //
    // }
    onUnexpectedOption() {
        //
    }
    onOption() {
        return createValueNOPSideEffects()
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
        return createValueNOPSideEffects()
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
        return createValueNOPSideEffects()
    }
}