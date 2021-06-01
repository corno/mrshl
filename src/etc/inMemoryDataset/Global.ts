import { createChangeController } from "./changeControl/ChangeController"
import { ErrorManager } from "./implementation/ErrorManager"

export class Global {
    public readonly changeController = createChangeController()
    public errorManager = new ErrorManager()
}
