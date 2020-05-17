import * as g from "../generics/index"
import * as bi from "../asyncAPI"
import * as d from "../definition/index"
import { ErrorManager, RootErrorsAggregator } from "./implementation/ErrorManager"
import { Global } from "./implementation/Global"
import { Node } from "./implementation/Node"

export class RootImp {
    public readonly errorsAggregator = new RootErrorsAggregator()
    public readonly global = new Global()
    public readonly schema: d.Schema
    public readonly rootNode: Node
    public readonly schemaPath: string
    constructor(schemaPath: string, schema: d.Schema) {
        this.schemaPath = schemaPath
        this.rootNode = new Node(schema["root type"].get().node, null)
        this.schema = schema
        this.global = new Global()
    }
}

export class Root implements bi.Root {

    public readonly errorAmount: g.ReactiveValue<number>
    public readonly errorManager: ErrorManager

    public readonly commands: g.Dictionary<Command>
    public readonly hasUndoActions: g.ISubscribableValue<boolean>
    public readonly hasRedoActions: g.ISubscribableValue<boolean>
    public readonly hasUnserializedChanges: g.ISubscribableValue<boolean>
    public readonly rootNode: Node

    private readonly imp: RootImp

    //public readonly rootNode: Node
    constructor(rootImp: RootImp) {
        this.imp = rootImp
        this.commands = new g.Dictionary({})
        this.rootNode = rootImp.rootNode
        this.hasUndoActions = rootImp.global.changeController.executedChanges.hasChanges
        this.hasRedoActions = rootImp.global.changeController.revertedChanges.hasChanges
        this.errorAmount = rootImp.errorsAggregator.errorCount
        this.errorManager = rootImp.global.errorManager

        this.hasUnserializedChanges = new g.DerivedReactiveValue(rootImp.global.changeController.amountOfChangesSinceLastSerialization, position => {
            if (position === null) {
               return true
            } else {
                return position !== 0
            }
        })
    }
    public serialize(_callback: (data: string) => void) {
        throw new Error("IMPLEMENT ME")
        //callback(s.serialize(this.imp.schemaPath, this.imp.schema.root, this.rootNode))
        this.imp.global.changeController.resetSerializationPosition()
    }
    public undo() {
        this.imp.global.changeController.undo()
    }
    public redo() {
        this.imp.global.changeController.redo()
    }
    public purgeChanges() {
        this.imp.global.changeController.purgeChanges()
        this.rootNode.purgeChanges()
    }

}

export class Command {
    public readonly execute: () => void
    constructor(execute: () => void) {
        this.execute = execute
    }
}

export function createBackendRoot(imp: RootImp) {
    return new Root(imp)
}
