import * as d from "../definition/index"
import * as s from "../serialize-deserialize/index"

function copyNode(
    definition: d.Node,
    sourceNode: s.SerializableNode,
    targetNode: s.NodeBuilder
) {
    definition.properties.forEach((property, pKey) => {
        if (property.type[0] !== "collection") {
            return
        }
        const $ = property.type[1]
        const sourceCollection = sourceNode.getCollection(pKey)
        const targetCollection = targetNode.getCollection(pKey)
        sourceCollection.forEachEntry(e => {
            const entry = targetCollection.createEntry()
            copyEntry($, e, entry)
            entry.insert()
        })
    })
    definition.properties.forEach((property, pKey) => {
        if (property.type[0] !== "component") {
            return
        }
        const comp = targetNode.getComponent(pKey)

        copyNode(
            property.type[1].type.get().node,
            sourceNode.getComponent(pKey).node,
            comp.node
        )
    })
    definition.properties.forEach((property, pKey) => {
        if (property.type[0] !== "state group") {
            return
        }
        const $ = property.type[1]
        const sourceStateGroup = sourceNode.getStateGroup(pKey)
        const sourceState = sourceStateGroup.getCurrentState()
        const targetState = targetNode.getStateGroup(pKey).setState(sourceState.getStateKey())
        copyNode(
            $.states.get(sourceState.getStateKey()).node,
            sourceState.node,
            targetState.node,
        )
    })
    definition.properties.forEach((property, pKey) => {
        if (property.type[0] !== "value") {
            return
        }
        targetNode.getValue(pKey).setValue(sourceNode.getValue(pKey).getValue())
    })
}

export function copyEntry(
    definition: d.Collection,
    sourceEntry: s.SerializableEntry,
    targetEntry: s.EntryBuilder
) {
    copyNode(definition.node, sourceEntry.node, targetEntry.node)
}
