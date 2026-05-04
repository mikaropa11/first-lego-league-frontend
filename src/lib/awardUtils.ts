import type { Award } from "@/types/award";

function pickFirstNonEmpty(...values: Array<string | null | undefined>): string | null {
    for (const value of values) {
        const trimmed = value?.trim();
        if (trimmed) {
            return trimmed;
        }
    }

    return null;
}

export function getAwardLabel(award: Award, fallbackIndex: number): string {
    return pickFirstNonEmpty(award.name, award.title, award.category) ?? `Award ${fallbackIndex + 1}`;
}

export function getAwardWinnerTeamUri(award: Award): string | null {
    const winnerTeamFromLink = award.link("winnerTeam")?.href;
    if (winnerTeamFromLink) {
        return winnerTeamFromLink;
    }

    if (typeof award.winnerTeam === "string" && award.winnerTeam.length > 0) {
        return award.winnerTeam;
    }

    const winnerFromLink = award.link("winner")?.href;
    if (winnerFromLink) {
        return winnerFromLink;
    }

    const winner = Reflect.get(award, "winner");
    if (typeof winner === "string" && winner.length > 0) {
        return winner;
    }

    return null;
}

export function normalizeUri(resourceUri: string | null | undefined): string | null {
    if (!resourceUri) {
        return null;
    }

    const sanitizedUri = resourceUri.split(/[?#]/, 1)[0] ?? null;
    if (!sanitizedUri) {
        return null;
    }

    return sanitizedUri.replace(/^https?:\/\/[^/]+/i, "");
}
