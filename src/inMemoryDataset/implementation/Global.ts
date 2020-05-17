import { createChangeController } from "./ChangeController"
import { ErrorManager } from "./ErrorManager"

export class Global {
    public readonly changeController = createChangeController()
    public errorManager = new ErrorManager()
}
