import * as astn from "astn"
import { Root } from "../ParsingSideEffectsAPI"
import { createHoverTextsGenerator } from "./createHoverTextsGenerator"
import { isPositionBeforeLocation } from "./isPositionBeforeLocation"

export function createHoverTextFinder(
    positionLine: number, //the line where the hover is requested
    positionCharacter: number, //the character where the hover is requested
    callback: (hoverText: string) => void
): Root {
    return createHoverTextsGenerator(
        (tokenRange, getHoverText) => {
            //console.log("LOCATION", range.start.line, range.start.column, range.end.line, range.end.column)

            if (isPositionBeforeLocation(positionLine, positionCharacter, tokenRange.start)) {
                return
            }
            if (isPositionBeforeLocation(positionLine, positionCharacter, astn.getEndLocationFromRange(tokenRange))) {
                if (getHoverText !== null) {
                    callback(getHoverText())
                }
            }
        },
        () => {
            //
        }
    )
}
