import * as astn from "astn"
import * as db5api from "../db5api"
import { createHoverTextsGenerator } from "../ide-integration/createHoverTextsGenerator"
import { isPositionBeforeLocation } from "./isPositionBeforeLocation"

export function createHoverTextFinder(
    positionLine: number, //the line where the hover is requested
    positionCharacter: number, //the character where the hover is requested
    callback: (hoverText: string) => void
): db5api.RootHandler<astn.ParserAnnotationData> {
    return createHoverTextsGenerator(
        (annotation, getHoverText) => {
            //console.log("LOCATION", range.start.line, range.start.column, range.end.line, range.end.column)

            if (isPositionBeforeLocation(positionLine, positionCharacter, annotation.range.start)) {
                return
            }
            if (isPositionBeforeLocation(positionLine, positionCharacter, astn.getEndLocationFromRange(annotation.range))) {
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
