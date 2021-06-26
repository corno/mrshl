import { Node, Entry, initializeState, setValue, createEntry } from "./internals"
import * as def from "astn-core"
import { Global } from "./Global"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}
function cc<T>(input: T, callback: (output: T) => void): void {
    callback(input)
}

function copyNode(
    definition: def.NodeDefinition,
    sourceNode: Node,
    targetNode: Node,
    global: Global,
) {
    definition.properties.forEach(($, pKey) => {
        switch ($.type[0]) {
            case "component":
                cc($.type[1], $ => {
                    const comp = targetNode.components.getUnsafe(pKey)
                    copyNode(
                        $.type.get().node,
                        sourceNode.components.getUnsafe(pKey).node,
                        comp.node,
                        global,
                    )
                })
                break
            case "dictionary":
                cc($.type[1], $ => {
                    const targetCollection = targetNode.collections.getUnsafe(pKey)
                    sourceNode.collections.getUnsafe(pKey).entries.forEach(e => {
                        const entry = createEntry(
                            $.node,
                            targetCollection,
                            global,
                        )
                        copyEntry(
                            $.node,
                            e.entry,
                            entry,
                            global,
                        )
                    })
                })
                break
            case "list":
                cc($.type[1], $ => {
                    const targetCollection = targetNode.collections.getUnsafe(pKey)
                    sourceNode.collections.getUnsafe(pKey).entries.forEach(e => {
                        const entry = createEntry(
                            $.node,
                            targetCollection,
                            global,
                        )
                        copyEntry(
                            $.node,
                            e.entry,
                            entry,
                            global
                        )
                    })
                })
                break
            case "simple string":
                cc($.type[1], _$ => {
                    setValue(
                        targetNode.values.getUnsafe(pKey),
                        targetNode.values.getUnsafe(pKey).value.get(),
                        sourceNode.values.getUnsafe(pKey).value.get(),
                    )
                })
                break
            case "multiline string":
                throw new Error("IMPLEMENT ME")
                // cc($.type[1], _$ => {
                //     setValue(
                //         targetNode.values.getUnsafe(pKey),
                //         targetNode.values.getUnsafe(pKey).value.get(),
                //         sourceNode.values.getUnsafe(pKey).value.get(),
                //     )
                // })
                break
            case "tagged union":
                cc($.type[1], $ => {
                    const sourceState = sourceNode.taggedUnions.getUnsafe(pKey).currentState
                    const optionName = sourceState.get().key
                    const targetState = initializeState(
                        $.options.getUnsafe(optionName),
                        targetNode.taggedUnions.getUnsafe(pKey),
                        optionName,
                        global,
                        () => {
                            throw new Error(`IMPLEMENT ME ONERROR`)
                        }
                    )
                    copyNode(
                        $.options.getUnsafe(sourceState.get().key).node,
                        sourceState.get().node,
                        targetState.node,
                        global,
                    )
                })
                break
            default:
                assertUnreachable($.type[0])
        }
    })
}

export function copyEntry(
    definition: def.NodeDefinition,
    sourceEntry: Entry,
    targetEntry: Entry,
    global: Global,
): void {
    copyNode(
        definition,
        sourceEntry.node,
        targetEntry.node,
        global,
    )
}
