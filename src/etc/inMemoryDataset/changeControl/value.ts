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
            imp.setValue(this.imp, previousValue, newValue)
        }
        //FIXME call onError
    }
}