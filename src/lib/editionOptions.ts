import type { Edition } from "@/types/edition";

export type SelectOption = {
    label: string;
    value: string;
};

export function getEditionLabel(edition: Edition): string {
    const parts: string[] = [];

    if (edition.year !== undefined && edition.year !== null) {
        parts.push(String(edition.year));
    }

    if (edition.venueName) {
        parts.push(edition.venueName);
    }

    if (edition.state) {
        parts.push(edition.state);
    }

    return parts.join(" - ") || "Unnamed edition";
}

export function getEditionOptions(editions: Edition[]): SelectOption[] {
    return editions
        .map((edition) => {
            const value = edition.link("self")?.href ?? edition.uri ?? "";

            if (!value) {
                return null;
            }

            return {
                label: getEditionLabel(edition),
                value,
            };
        })
        .filter((option): option is SelectOption => option !== null);
}
