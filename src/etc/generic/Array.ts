import { Maybe } from "./Maybe"

export function findInArray<T>(array: T[], callback: (element: T) => boolean): Maybe<number> {
    for (let i = 0; i !== array.length; i++) {
        if (callback(array[i])) {
            return new Maybe(i)
        }
    }
    return new Maybe<number>(null)
}

export function removeFromArray<T>(array: T[], callback: (element: T) => boolean): void {
    const index = findInArray(array, callback)
    index.map(
        i => array.splice(i, 1),
        () => console.error("entry not in array")
    )
    const index2 = findInArray(array, callback)
    index2.ifExists(() => {
        console.error("entry was more than once in the array")
    })
}

export function createArray<T>(): T[] {
    return []
}
