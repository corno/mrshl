import * as dapi from "../syncAPI"


function copyNode(
    sourceNode: dapi.Node,
    targetNode: dapi.Node
) {
    sourceNode.forEachProperty((property, pKey) => {
        if (property.type[0] !== "dictionary") {
            return
        }
        const $ = property.type[1]
        const targetCollection = targetNode.getDictionary(pKey)
        $.forEachEntry(e => {
            const entry = targetCollection.createEntry()
            copyEntry(e, entry)
        })
    })
    sourceNode.forEachProperty((property, pKey) => {
        if (property.type[0] !== "list") {
            return
        }
        const $ = property.type[1]
        const targetCollection = targetNode.getList(pKey)
        $.forEachEntry(e => {
            const entry = targetCollection.createEntry()
            copyEntry(e, entry)
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
        const targetState = targetNode.getStateGroup(pKey).setState(sourceState.getStateKey(), () => {
            //FIXME
        })
        copyNode(
            sourceState.node,
            targetState.node,
        )
    })
    sourceNode.forEachProperty((property, pKey) => {
        if (property.type[0] !== "value") {
            return
        }
        targetNode.getValue(pKey).setValue(sourceNode.getValue(pKey).getValue(), () => {
            //FIXME
        })
    })
}

export function copyEntry(
    sourceEntry: dapi.Entry,
    targetEntry: dapi.Entry
) {
    copyNode(sourceEntry.node, targetEntry.node)
}
