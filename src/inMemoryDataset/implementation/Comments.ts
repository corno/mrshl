import * as syncAPI from "../../syncAPI"

export class Comment implements syncAPI.Comment {
    readonly value: string
    constructor(value: string) {
        this.value = value
    }
}

export class Comments implements syncAPI.Comments {
    private readonly imp: Comment[] = []
    addComment(comment: string): void {
        this.imp.push(new Comment(comment))
    }
    getComments(): Comment[] {
        return this.imp
    }
}