import { IValue } from "./ChangeController"
import * as imp from "../implementation"


export class ValueUpdate implements IValue {
    private readonly imp: imp.Value
    constructor(valueImp: imp.Value) {
        this.imp = valueImp
    }
    getValue() {
        return this.imp.value.get()
    }
    public setValue(newValue: string, _onError?: (messsage: string) => void) {
        const previousValue = this.imp.value.get()
        if (previousValue === newValue) {
            return
        } else {
            this.imp.value.update(newValue)
            this.imp.changeSubscribers.forEach(cs => cs(previousValue, newValue))
            if (newValue === this.imp.initialValue) {
                this.imp.changeStatus.update(["not changed"])
            } else {
                this.imp.changeStatus.update(["changed", {
                    originalValue: this.imp.initialValue,
                }])
            }
        }
        //FIXME call onError
    }
}