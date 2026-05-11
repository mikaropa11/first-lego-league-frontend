export function isEditionActive(state?: string): boolean {
    return state === "OPEN";
}

export function isEditionFinished(state?: string): boolean {
    return state === "CLOSED";
}

export function isEditionDraft(state?: string): boolean {
    return state === "DRAFT";
}