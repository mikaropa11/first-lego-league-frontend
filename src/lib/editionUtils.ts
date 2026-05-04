import type { Edition } from "@/types/edition";

export function getEditionOptionLabel(edition: Pick<Edition, "year" | "venueName">): string {
    const baseLabel = edition.year ?? "Edition";
    return edition.venueName ? `${baseLabel} - ${edition.venueName}` : `${baseLabel}`;
}
