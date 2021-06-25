import { createChangeController } from "./changeControl/createChangeController"
import { ErrorManager } from "./internals/ErrorManager"

export class Global {
    public readonly changeController = createChangeController()
    public errorManager = new ErrorManager()
}
