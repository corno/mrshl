import * as bc from "bass-clarinet"

export type GenerateSnippets = () => string[]

export type RegisterSnippetsGenerators = (range: bc.Range, intraSnippetGenerator: GenerateSnippets | null, snippetAfterGenerator: GenerateSnippets | null) => void
