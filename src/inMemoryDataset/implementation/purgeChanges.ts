import { Node } from "./Node"

export function purgeNodeChanges(node: Node) {
    node.collections.forEach(c => {
        c.entries.removeEntries(candidate => {
            return candidate.status.get()[0] === "inactive"
        })
        c.entries.forEach(entry => {
            entry.isAdded.update(false)
            purgeNodeChanges(entry.entry.node)
        })
    })
    node.components.forEach(c => {
        purgeNodeChanges(c.node)
    })
    node.stateGroups.forEach(sg => {
        sg.statesOverTime.removeEntries(sot => {
            return !sot.isCurrentState.get()
        })
        if (sg.changeStatus.get()[0] !== "not changed") {
            sg.changeStatus.update(["not changed"])
        }
        sg.createdInNewContext.update(false)
        purgeNodeChanges(sg.currentState.get().node)
    })
    node.values.forEach(v => {
        v.createdInNewContext.update(false)
        if (v.changeStatus.get()[0] !== "not changed") {
            v.changeStatus.forceUpdate(["not changed"])
        }
    })
}