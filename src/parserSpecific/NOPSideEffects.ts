/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../deserialize/interfaces/streamingValidationAPI"
/* eslint
    "max-classes-per-file": off,
*/

export function createNOPSideEffects<Annotation>(): streamVal.RootHandler<Annotation> {
    return {
        root: createValueNOPSideEffects(),
        onEnd: () => {
            //
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
        // onUnexpectedProperty: () => {
        //     //
        // }
        onVerboseTypeClose: () => {
            //
        },
    }
}

function createShorthandTypeNOPSideEffects<Annotation>(): streamVal.ShorthandTypeHandler<Annotation> {
    return {
        onShorthandTypeClose: () => {
            //
        },
        onProperty: () => {
            return createValueNOPSideEffects()
        },
    }
}

function createStateGroupNOPSideEffects<Annotation>(): streamVal.TaggedUnionHandler<Annotation> {
    return {
        onUnexpectedOption: () => {
            //
        },
        onOption: () => {
            return createValueNOPSideEffects()
        },
    }
}

function createValueNOPSideEffects<Annotation>(): streamVal.ValueHandler<Annotation> {

    return {
        onDictionary: () => {
            return createDictionaryNOPSideEffects()
        },
        onList: () => {
            return createListNOPSideEffects()
        },
        onTaggedUnion: () => {
            return createStateGroupNOPSideEffects()
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
        onShorthandTypeOpen: () => {
            return createShorthandTypeNOPSideEffects()
        },
        onVerboseTypeOpen: () => {
            return createVerboseTypeNOPSideEffects()
        },
    }
}


function createDictionaryNOPSideEffects<Annotation>(): streamVal.DictionaryHandler<Annotation> {
    return {
        onClose: () => {
            //
        },
        onEntry: () => {
            return createValueNOPSideEffects()
        },
    }
}

function createListNOPSideEffects<Annotation>(): streamVal.ListHandler<Annotation> {
    return {
        onClose: () => {
            //
        },
        onEntry: () => {
            return createValueNOPSideEffects()
        },
    }
}