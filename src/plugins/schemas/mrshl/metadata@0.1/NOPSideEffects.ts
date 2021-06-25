/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "../../../../deserialize/interfaces/streamingValidationAPI"

export function createNOPSideEffects<Annotation>(): streamVal.RootHandler<Annotation> {

    class NOPSideEffects<Annotation> implements streamVal.RootHandler<Annotation> {
        root: streamVal.ValueHandler<Annotation>
        constructor() {
            this.root = createValueNOPSideEffects()
        }
        onEnd() {
            //
        }
    }
    return new NOPSideEffects()
}

function createValueNOPSideEffects<Annotation>(): streamVal.ValueHandler<Annotation> {
    return {
        onShorthandTypeOpen: () => {

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
            return new ShorthandTypeNOPSideEffects()
        },
        onVerboseTypeOpen: () => {

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
            return createVerboseTypeNOPSideEffects()
        },
        onDictionary: () => {

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
            return new DictionaryNOPSideEffects()
        },
        onList: () => {

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
            return new ListNOPSideEffects()
        },
        onTaggedUnion: () => {
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