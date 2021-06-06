export type CommentType =
    | ["block"]
    | ["line"]

export class Comment {
    readonly value: string
    readonly type: CommentType
    constructor(value: string, type: CommentType) {
        this.value = value
        this.type = type
    }
}

export class Comments {
    private readonly imp: Comment[] = []
    addComment(comment: string, type: CommentType): void {
        this.imp.push(new Comment(comment, type))
    }
    getComments(): Comment[] {
        return this.imp
    }
}