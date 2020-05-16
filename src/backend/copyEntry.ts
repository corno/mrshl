import * as s from "../serialize-deserialize/index"

function copyNode(
    sourceNode: s.SerializableNode,
    targetNode: s.NodeBuilder
) {
    sourceNode.forEachProperty((property, pKey) => {
        if (property.type[0] !== "dictionary") {
            return
        }
        const $ = property.type[1]
        const targetCollection = targetNode.getCollection(pKey)
        $.forEachEntry(e => {
            const entry = targetCollection.createEntry()
            copyEntry(e, entry)
            entry.insert()
        })
    })
    sourceNode.forEachProperty((property, pKey) => {
        if (property.type[0] !== "list") {
            return
        }
        const $ = property.type[1]
        const targetCollection = targetNode.getCollection(pKey)
        $.forEachEntryL(e => {
            const entry = targetCollection.createEntry()
            copyEntry(e, entry)
            entry.insert()
        })
    })
    sourceNode.forEachProperty((property, pKey) => {
        if (property.type[0] !== "component") {
            return
        }
        const comp = targetNode.getComponent(pKey)

        copyNode(
            sourceNode.getComponent(pKey).node,
            comp.node
        )
    })
    sourceNode.forEachProperty((property, pKey) => {
        if (property.type[0] !== "state group") {
            return
        }
        const $ = property.type[1]
        const sourceState = $.getCurrentState()
        const targetState = targetNode.getStateGroup(pKey).setState(sourceState.getStateKey())
        copyNode(
            sourceState.node,
            targetState.node,
        )
    })
    sourceNode.forEachProperty((property, pKey) => {
        if (property.type[0] !== "value") {
            return
        }
        targetNode.getValue(pKey).setValue(sourceNode.getValue(pKey).getValue())
    })
}

export function copyEntry(
    sourceEntry: s.SerializableEntry,
    targetEntry: s.EntryBuilder
) {
    copyNode(sourceEntry.node, targetEntry.node)
}
