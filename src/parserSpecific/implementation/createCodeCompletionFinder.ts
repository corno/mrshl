import * as astn from "astn"
import * as astncore from "astn-core"
import { isPositionBeforeLocation } from "./isPositionBeforeLocation"

export function createCodeCompletionFinder(
    completionPositionLine: number,
    completionPositionCharacter: number,
    callback: (codeCompletion: string) => void
): astncore.RootHandler<astn.TokenizerAnnotationData> {
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

    return astncore.createCodeCompletionsGenerator(
        (annotation, intra, after) => {
            //console.log("LOCATION", range.start.line, range.start.column, range.end.line, range.end.column)

            if (positionAlreadyFound) {
                return
            }
            if (isPositionBeforeLocation(completionPositionLine, completionPositionCharacter, annotation.range.start)) {
                //console.log("AFTER", previousAfter)
                generate(previousAfter)
                positionAlreadyFound = true
                return
            }
            if (isPositionBeforeLocation(completionPositionLine, completionPositionCharacter, astn.getEndLocationFromRange(annotation.range))) {
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
