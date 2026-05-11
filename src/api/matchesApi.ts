import type { AuthStrategy } from "@/lib/authProvider";
import { ApiError } from "@/types/errors";
import { Match } from "@/types/match";
import { MatchResult, MatchResultEntity, RegisterMatchScoreRequest, RegisterMatchScoreResponse } from "@/types/matchResult";
import type { HalPage } from "@/types/pagination";
import { CompetitionTable } from "@/types/competitionTable";
import { Referee } from "@/types/referee";
import { Round } from "@/types/round";
import { Team } from "@/types/team";
import { API_BASE_URL, createHalResource, deleteHal, fetchHalCollection, fetchHalPagedCollection, fetchHalResource, patchHal, postHal } from "./halClient";

export type CreateMatchPayload = {
    startTime: string;
    endTime: string;
    round: string;
    competitionTable: string;
    teamA: string;
    teamB: string;
    referee: string;
};

export interface MatchSearchItemResponse {
    readonly matchId: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly tableId: string;
    readonly roundId: number;
}

export interface MatchSearchPageResponse {
    readonly page: number;
    readonly size: number;
    readonly totalElements: number;
    readonly items: MatchSearchItemResponse[];
}

export interface MatchFilterParams {
    readonly startTime?: string;
    readonly endTime?: string;
    readonly tableId?: string;
    readonly roundId?: string;
    readonly page?: number;
    readonly size?: number;
}

function getSafeMatchResultResourcePath(resourceUri: string) {
    let resourcePath = resourceUri;

    if (resourceUri.startsWith("http")) {
        const url = new URL(resourceUri);
        const apiUrl = new URL(API_BASE_URL);

    if (url.hostname !== apiUrl.hostname) {
        throw new ApiError("Invalid match result resource URL", 400, true);
    }

        resourcePath = `${url.pathname}${url.search}`;
    }

    const pathname = resourcePath.split(/[?#]/, 1)[0];

    if (!/^\/matchResults\/[^/]+$/.test(pathname)) {
        throw new ApiError("Invalid match result resource path", 400, true);
    }

    return resourcePath;
}

export class MatchesService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getMatches(): Promise<Match[]> {
        return fetchHalCollection<Match>(
            "/matches?sort=startTime,asc&sort=id,asc&size=1000",
            this.authStrategy,
            "matches",
        );
    }

    async getMatchesPaged(page: number, size: number): Promise<HalPage<Match>> {
        return fetchHalPagedCollection<Match>(
            "/matches?sort=startTime,asc&sort=id,asc",
            this.authStrategy,
            "matches",
            page,
            size,
        );
    }

    async getMatchesByEdition(editionUri: string): Promise<Match[]> {
        return fetchHalCollection<Match>(
            `${editionUri}?sort=startTime,asc&sort=id,asc&size=1000`,
            this.authStrategy,
            "matches",
        );
    }

    async getMatchesFiltered(filters: MatchFilterParams): Promise<MatchSearchPageResponse> {
        const params = new URLSearchParams();

        if (filters.startTime) params.set("startTime", filters.startTime);
        if (filters.endTime) params.set("endTime", filters.endTime);
        if (filters.tableId) params.set("tableId", filters.tableId);
        if (filters.roundId) params.set("roundId", String(filters.roundId));
        if (filters.page !== undefined) params.set("page", String(filters.page));
        if (filters.size !== undefined) params.set("size", String(filters.size));

        const auth = await this.authStrategy.getAuth();
        const query = params.toString();
        const response = await fetch(`${API_BASE_URL}/matches/filter${query ? `?${query}` : ""}`, {
            headers: {
                Accept: "application/json",
                ...(auth ? { Authorization: auth } : {}),
            },
            cache: "no-store",
        });

        if (!response.ok) {
            let message = `HTTP ${response.status}`;

            try {
                const data = await response.json() as { message?: string; error?: string; detail?: string };
                message = data.message ?? data.error ?? data.detail ?? message;
            } catch {
                const text = await response.text().catch(() => "");
                if (text.trim()) {
                    message = text;
                }
            }

            throw new ApiError(message, response.status, true);
        }

        return response.json() as Promise<MatchSearchPageResponse>;
    }

    async getMatchById(id: string): Promise<Match> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Match>(`/matches/${matchId}`, this.authStrategy);
    }

    async getMatchRound(id: string): Promise<Round> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Round>(`/matches/${matchId}/round`, this.authStrategy);
    }

    async getMatchTeamA(id: string): Promise<Team> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Team>(`/matches/${matchId}/teamA`, this.authStrategy);
    }

    async getMatchTeamB(id: string): Promise<Team> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Team>(`/matches/${matchId}/teamB`, this.authStrategy);
    }

    async getMatchCompetitionTable(id: string): Promise<CompetitionTable> {
        const matchId = encodeURIComponent(id);

        return fetchHalResource<CompetitionTable>(
            `/matches/${matchId}/competitionTable`,
            this.authStrategy,
        );
    }

    async getMatchReferee(id: string): Promise<Referee> {
        const matchId = encodeURIComponent(id);
        return fetchHalResource<Referee>(`/matches/${matchId}/referee`, this.authStrategy);
    }

    async createMatch(data: CreateMatchPayload): Promise<Match> {
        return createHalResource<Match>(
            "/matches",
            data,
            this.authStrategy,
            "match",
        );
    }

    async updateMatch(id: string, data: CreateMatchPayload): Promise<void> {
        const matchId = encodeURIComponent(id);
        await patchHal(`/matches/${matchId}`, data, this.authStrategy);
    }

    async getMatchResults(matchUri: string): Promise<MatchResult[]> {
        const encodedUri = encodeURIComponent(matchUri);

        return fetchHalCollection<MatchResultEntity>(
            `/matchResults/search/findByMatch?match=${encodedUri}`,
            this.authStrategy,
            "matchResults",
        );
    }

    async registerMatchResult(
        data: RegisterMatchScoreRequest,
    ): Promise<RegisterMatchScoreResponse> {
        const resource = await postHal(
            "/matchResults/register",
            data as unknown as Record<string, unknown>,
            this.authStrategy,
        );

        if (!resource) {
            throw new ApiError("No response from server", 500, true);
        }

        const raw = resource as unknown as RegisterMatchScoreResponse;

        return {
            matchId: raw.matchId,
            resultSaved: raw.resultSaved,
            rankingUpdated: raw.rankingUpdated,
        };
    }

    async updateMatchResult(resultUri: string, score: number): Promise<void> {
        const authorization = await this.authStrategy.getAuth();
        const resourcePath = getSafeMatchResultResourcePath(resultUri);

        const response = await fetch(`${API_BASE_URL}${resourcePath}`, {
            method: "PATCH",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/merge-patch+json",
                ...(authorization ? { Authorization: authorization } : {}),
            },
            body: JSON.stringify({ score }),
            cache: "no-store",
        });

        if (!response.ok) {
            const message = await response.text();

            throw new ApiError(
                message || `Failed to update match result. HTTP ${response.status}`,
                response.status,
                true,
            );
        }
    }

    async deleteMatch(id: string): Promise<void> {
        const matchId = encodeURIComponent(id);
        await deleteHal(`/matches/${matchId}`, this.authStrategy);
    }
}
