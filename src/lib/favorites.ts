export type FavoriteEntityType = "team" | "edition" | "competition-table" | "scientific-project" | "match";

export interface FavoriteItem {
    readonly type: FavoriteEntityType;
    readonly id: string;
    readonly label: string;
    readonly href: string;
    readonly secondaryLabel?: string;
}

export const FAVORITES_STORAGE_KEY = "fll:favorites";

export function getFavoriteKey(item: Pick<FavoriteItem, "type" | "id">): string {
    return `${item.type}:${item.id}`;
}

function isFavoriteEntityType(value: unknown): value is FavoriteEntityType {
    return value === "team"
        || value === "edition"
        || value === "competition-table"
        || value === "scientific-project"
        || value === "match";
}

function normalizeFavorite(item: FavoriteItem): FavoriteItem {
    return {
        type: item.type,
        id: String(item.id).trim(),
        label: String(item.label).trim(),
        href: String(item.href).trim(),
        secondaryLabel: item.secondaryLabel?.trim() || undefined,
    };
}

export function parseFavorites(raw: string): FavoriteItem[] {
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            return [];
        }

        const favorites = parsed
            .filter(isFavoriteItem)
            .map(normalizeFavorite);

        const seen = new Set<string>();
        const unique: FavoriteItem[] = [];

        for (const favorite of favorites) {
            const key = getFavoriteKey(favorite);
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            unique.push(favorite);
        }

        return unique;
    } catch {
        return [];
    }
}

function isFavoriteItem(value: unknown): value is FavoriteItem {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<FavoriteItem> & { type?: unknown };

    return (
        isFavoriteEntityType(candidate.type) &&
        typeof candidate.id === "string" &&
        typeof candidate.label === "string" &&
        typeof candidate.href === "string"
    );
}

export function loadFavorites(): FavoriteItem[] {
    if (typeof window === "undefined") {
        return [];
    }

    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    return parseFavorites(raw ?? "");
}

export function saveFavorites(favorites: FavoriteItem[]): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites.map(normalizeFavorite)));
}

export function upsertFavorite(current: FavoriteItem[], item: FavoriteItem): FavoriteItem[] {
    const normalized = normalizeFavorite(item);
    const key = getFavoriteKey(normalized);

    return [
        normalized,
        ...current.filter((favorite) => getFavoriteKey(favorite) !== key),
    ];
}

export function removeFavorite(current: FavoriteItem[], item: Pick<FavoriteItem, "type" | "id">): FavoriteItem[] {
    const key = getFavoriteKey(item);
    return current.filter((favorite) => getFavoriteKey(favorite) !== key);
}

export function isFavorite(current: FavoriteItem[], item: Pick<FavoriteItem, "type" | "id">): boolean {
    const key = getFavoriteKey(item);
    return current.some((favorite) => getFavoriteKey(favorite) === key);
}
