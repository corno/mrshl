import * as fp from "fountain-pen"

export function cloneBlock(block: fp.Block): fp.Block {
    if (typeof block === "string") {
        return block
    }
    if (typeof block === "function") {
        return () => {
            return cloneBlock(block())
        }
    }
    if (block === null) {
        return null
    }
    if (block instanceof fp.Line) {
        return new fp.Line(cloneInlineSegment(block.segment))
    }
    const out: fp.Block[] = []
    block.forEach(i => {
        out.push(cloneBlock(i))
    })
    return []
}

export function cloneInlineSegment(inlineSegment: fp.InlineSegment): fp.InlineSegment {
    if (typeof inlineSegment === "string") {
        return inlineSegment
    }
    if (typeof inlineSegment === "function") {
        return () => {
            return cloneBlock(inlineSegment())
        }
    }
    if (inlineSegment === null) {
        return null
    }
    const out: fp.InlineSegment[] = []
    inlineSegment.forEach(i => {
        out.push(cloneInlineSegment(i))
    })
    return out
}
