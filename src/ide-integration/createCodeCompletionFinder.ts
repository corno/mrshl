import * as astn from "astn"
import { Root } from "../API/ParsingSideEffectsAPI"
import { createCodeCompletionsGenerator } from "./createCodeCompletionsGenerator"
import { isPositionBeforeLocation } from "./isPositionBeforeLocation"

export function createCodeCompletionFinder(
    completionPositionLine: number,
    completionPositionCharacter: number,
    callback: (codeCompletion: string) => void
): Root {
    let positionAlreadyFound = false
    let previousAfter: null | (() => string[]) = null
    //console.log("FINDING COMPLETIONS", line, character)
    function generate(gs: (() => string[]) | null) {
        if (gs !== null) {
            const codeCompletions = gs()
            //console.log(codeCompletions)
            codeCompletions.forEach(codeCompletion => {
                //console.log("codeCompletion", codeCompletion)
                callback(codeCompletion)
            })
        }

    }

    return createCodeCompletionsGenerator(
        (tokenRange, intra, after) => {
            //console.log("LOCATION", range.start.line, range.start.column, range.end.line, range.end.column)

            if (positionAlreadyFound) {
                return
            }
            if (isPositionBeforeLocation(completionPositionLine, completionPositionCharacter, tokenRange.start)) {
                //console.log("AFTER", previousAfter)
                generate(previousAfter)
                positionAlreadyFound = true
                return
            }
            if (isPositionBeforeLocation(completionPositionLine, completionPositionCharacter, astn.getEndLocationFromRange(tokenRange))) {
                //console.log("INTRA", intra)
                generate(intra)
                positionAlreadyFound = true
                return
            }
            previousAfter = after
        },
        () => {
            if (!positionAlreadyFound) {
                generate(previousAfter)
            }
        }
    )
}
