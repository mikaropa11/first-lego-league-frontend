import type { AuthStrategy } from "@/lib/authProvider";
import { Edition } from "@/types/edition";
import type { EditionCompetitionTable } from "@/types/competitionTableSchedule";
import { ApiError } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import { Team } from "@/types/team";
import {
    API_BASE_URL,
    createHalResource,
    fetchHalCollection,
    fetchHalPagedCollection,
    fetchHalResource,
    updateHalResource,
} from "./halClient";

export type CreateEditionPayload = {
    year: number;
    venueName: string;
    description: string;
};

export type UpdateEditionPayload = {
    year?: number;
    venueName?: string;
    description?: string;
};

function normalizeResourcePath(resourceUri: string) {
    if (resourceUri.startsWith("/")) {
        return resourceUri;
    }

    try {
        const parsed = new URL(resourceUri);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return resourceUri;
    }
}

export class EditionsService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getEditions(): Promise<Edition[]> {
        return fetchHalCollection<Edition>("/editions", this.authStrategy, "editions");
    }

    async getEditionsPaged(page: number, size: number): Promise<HalPage<Edition>> {
        return fetchHalPagedCollection<Edition>(
            "/editions",
            this.authStrategy,
            "editions",
            page,
            size,
        );
    }

    async getEditionById(id: string): Promise<Edition> {
        const editionId = encodeURIComponent(id);
        return fetchHalResource<Edition>(`/editions/${editionId}`, this.authStrategy);
    }

    async getEditionByUri(resourceUri: string): Promise<Edition> {
        return fetchHalResource<Edition>(
            normalizeResourcePath(resourceUri),
            this.authStrategy,
        );
    }

    async getEditionByYear(year: string | number): Promise<Edition | null> {
        const normalizedYear = encodeURIComponent(String(year));
        const editions = await fetchHalCollection<Edition>(
            `/editions/search/findByYear?year=${normalizedYear}`,
            this.authStrategy,
            "editions",
        );

        return editions.length > 0 ? editions[0] : null;
    }

    async getEditionsByVenueName(venueName: string): Promise<Edition[]> {
        return fetchHalCollection<Edition>(
            `/editions/search/findByVenueName?venueName=${encodeURIComponent(venueName)}`,
            this.authStrategy,
            "editions",
        );
    }

    async getEditionTeams(id: string): Promise<Team[]> {
        const editionId = encodeURIComponent(id);

        return fetchHalCollection<Team>(
            `/editions/${editionId}/teams`,
            this.authStrategy,
            "teams",
        );
    }

    async createEdition(data: CreateEditionPayload): Promise<Edition> {
        return createHalResource<Edition>(
            "/editions",
            data,
            this.authStrategy,
            "edition",
        );
    }

    async updateEdition(id: string, data: UpdateEditionPayload): Promise<Edition> {
        const editionId = encodeURIComponent(id);

        return updateHalResource<Edition>(
            `/editions/${editionId}`,
            data,
            this.authStrategy,
            "edition",
        );
    }

    async updateEditionState(id: string, newState: string): Promise<Edition> {
        const editionId = encodeURIComponent(id);
        const authorization = await this.authStrategy.getAuth();

        const response = await fetch(`${API_BASE_URL}/editions/${editionId}/state`, {
            method: "PATCH",
            headers: {
                Accept: "application/vnd.hal+json",
                "Content-Type": "application/json",
                ...(authorization ? { Authorization: authorization } : {}),
            },
            body: JSON.stringify({ state: newState }),
            cache: "no-store",
        });

        if (!response.ok) {
            const message = await response.text();

            throw new ApiError(
                message || `Failed to update edition state. HTTP ${response.status}`,
                response.status,
                true,
            );
        }

        const updatedEdition = await this.getEditionById(id);

        if (updatedEdition.state && updatedEdition.state !== newState) {
            throw new ApiError(
                `Edition state was not persisted. Expected ${newState}, but API returned ${updatedEdition.state}.`,
                500,
                true,
            );
        }

        return {
            ...updatedEdition,
            state: updatedEdition.state ?? newState,
        };
    }

    async getEditionCompetitionTables(id: string): Promise<EditionCompetitionTable[]> {
        const encodedId = encodeURIComponent(id);
        const url = `${API_BASE_URL}/editions/${encodedId}/tables`;
        const authorization = await this.authStrategy.getAuth();

        const res = await fetch(url, {
            headers: {
                Accept: "application/json",
                ...(authorization ? { Authorization: authorization } : {}),
            },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new ApiError("Failed to fetch competition tables", res.status, true);
        }

        return res.json() as Promise<EditionCompetitionTable[]>;
    }

    async deleteEdition(id: string): Promise<void> {
        const editionId = encodeURIComponent(id);
        const authorization = await this.authStrategy.getAuth();

        const res = await fetch(`${API_BASE_URL}/editions/${editionId}`, {
            method: "DELETE",
            headers: {
                ...(authorization ? { Authorization: authorization } : {}),
            },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new ApiError("Failed to delete edition", res.status, true);
        }
    }
}
