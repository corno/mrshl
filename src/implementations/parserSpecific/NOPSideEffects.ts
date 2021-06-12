/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../../interfaces/streamingValidationAPI"
/* eslint
    "max-classes-per-file": off,
*/

export function createNOPSideEffects<Annotation>(): streamVal.RootHandler<Annotation> {
    return new NOPSideEffects()
}

class NOPSideEffects<Annotation> implements streamVal.RootHandler<Annotation> {
    node: streamVal.NodeHandler<Annotation>
    constructor() {
        this.node = createNodeNOPSideEffects()
    }
    onEnd() {
        //
    }
}

function createNodeNOPSideEffects<Annotation>(): streamVal.NodeHandler<Annotation> {
    return {
        onShorthandTypeOpen:() => {
            return new ShorthandTypeNOPSideEffects()
        },
        onVerboseTypeOpen:() => {
            return createVerboseTypeNOPSideEffects()
        },
    }
}

function createVerboseTypeNOPSideEffects<Annotation>(): streamVal.VerboseTypeHandler<Annotation> {
    return {
        onUnexpectedProperty: () => {
            //
        },
        onProperty:() =>{
            return createPropertyNOPSideEffects()
        },
        // onUnexpectedProperty() {
        //     //
        // }
        onVerboseTypeClose:() => {
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
        return createPropertyNOPSideEffects()
    }
}

class StateGroupNOPSideEffects<Annotation> implements streamVal.TaggedUnionHandler<Annotation> {
    constructor() {
        //
    }
    onUnexpectedOption() {
        //
    }
    onOption() {
        return createNodeNOPSideEffects()
    }
}

function createPropertyNOPSideEffects<Annotation>(): streamVal.PropertyHandler<Annotation> {

    return {
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
            return createNodeNOPSideEffects()
        },
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
        return createNodeNOPSideEffects()
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
        return createNodeNOPSideEffects()
    }
}