/* eslint
    "max-classes-per-file": off,
*/

import * as streamVal from "astn-core"

export function createNOPSideEffects<Annotation>(): streamVal.RootHandler<Annotation> {

    class NOPSideEffects<Annotation> {
        root: streamVal.TypedValueHandler<Annotation>
        constructor() {
            this.root = createValueNOPSideEffects()
        }
        onEnd() {
            //
        }
    }
    return new NOPSideEffects()
}

function createValueNOPSideEffects<Annotation>(): streamVal.TypedValueHandler<Annotation> {
    return {
        onShorthandTypeOpen: () => {

            class ShorthandTypeNOPSideEffects {
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

            class DictionaryNOPSideEffects {
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

            class ListNOPSideEffects {
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
            class StateGroupNOPSideEffects {
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