import * as astn from "astn"

export function isPositionBeforeLocation(
    positionLine: number,
    positionCharacter: number,
    location: astn.Location
): boolean {
    return positionLine < location.line
        || (
            positionLine === location.line
            && positionCharacter < location.column
        )
}