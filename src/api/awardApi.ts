import type { AuthStrategy } from "@/lib/authProvider";
import { Award, CreateAwardPayload } from "@/types/award";
import { Team } from "@/types/team";
import { createHalResource, deleteHal, fetchHalCollection, fetchHalResource, updateHalResource } from "./halClient";

function getResourceUri(resource: Team & { link: (relation: string) => { href?: string } | undefined }): string | null {
    return resource.uri ?? resource.link("self")?.href ?? null;
}

export interface UpdateAwardPayload {
    name: string;
    title?: string;
    category?: string;
    edition: string;
}

export class AwardsService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async deleteAward(awardId: string): Promise<void> {
        await deleteHal(`/awards/${encodeURIComponent(awardId)}`, this.authStrategy);
    }

    async getAwardsOfTeam(teamUri: string): Promise<Award[]> {
        const encodedTeamUri = encodeURIComponent(teamUri);
        const awards = await fetchHalCollection<Award>(
            `/awards/search/findByWinner?winner=${encodedTeamUri}`,
            this.authStrategy,
            "awards"
        );
        return awards;
    }

    async getAwardsOfEdition(editionUri: string): Promise<Award[]> {
        const encodedEditionUri = encodeURIComponent(editionUri);
        const awards = await fetchHalCollection<Award>(
            `/awards/search/findByEdition?edition=${encodedEditionUri}`,
            this.authStrategy,
            "awards"
        );

        return Promise.all(awards.map(async (award) => {
            const winnerHref = award.link("winner")?.href;
            if (!winnerHref) {
                return award;
            }

            const winner = await fetchHalResource<Team>(winnerHref, this.authStrategy);
            const winnerTeamUri = getResourceUri(winner);

            if (!winnerTeamUri) {
                return award;
            }

            return Object.assign(award, {
                winnerTeam: winnerTeamUri,
            });
        }));
    }

    async createAward(payload: CreateAwardPayload): Promise<Award> {
        return createHalResource<Award>(
            "/awards",
            {
                name: payload.name.trim(),
                title: payload.title.trim(),
                category: payload.category.trim(),
                edition: payload.edition,
                winner: payload.winner,
            },
            this.authStrategy,
            "award"
        );
    }

    async updateAward(awardUri: string, payload: UpdateAwardPayload): Promise<Award> {
        return updateHalResource<Award>(
            awardUri,
            {
                name: payload.name.trim(),
                title: payload.title?.trim() ?? "",
                category: payload.category?.trim() ?? "",
                edition: payload.edition,
            },
            this.authStrategy,
            "award"
        );
    }
}
