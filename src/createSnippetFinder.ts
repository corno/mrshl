import * as astn from "."
import { Root } from "./SideEffectsAPI"

export function createSnippetFinder(
    completionPositionLine: number,
    completionPositionCharacter: number,
    callback: (snippet: string) => void
): Root {
    let positionAlreadyFound = false
    let previousAfter: null | (() => string[]) = null
    //console.log("FINDING COMPLETIONS", line, character)
    function generate(gs: (() => string[]) | null) {
        if (gs !== null) {
            const snippets = gs()
            //console.log(snippets)
            snippets.forEach(snippet => {
                //console.log("SNIPPET", snippet)
                callback(snippet)
            })
        }

    }

    return astn.createSnippetsGenerator(
        (tokenRange, intra, after) => {
            //console.log("LOCATION", range.start.line, range.start.column, range.end.line, range.end.column)

            if (positionAlreadyFound) {
                return
            }
            if (completionPositionLine < tokenRange.start.line || (completionPositionLine === tokenRange.start.line && completionPositionCharacter < tokenRange.start.column)) {
                //console.log("AFTER", previousAfter)
                generate(previousAfter)
                positionAlreadyFound = true
                return
            }
            if (completionPositionLine < tokenRange.end.line || (completionPositionLine === tokenRange.end.line && completionPositionCharacter < tokenRange.end.column)) {
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
