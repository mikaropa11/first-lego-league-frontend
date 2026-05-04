'use server';

import { AwardsService } from "@/api/awardApi";
import { EditionsService } from "@/api/editionApi";
import { TeamsService } from "@/api/teamApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, NotFoundError } from "@/types/errors";
import { Team } from "@/types/team";
import { UsersService } from "@/api/userApi";

type CreateAwardResult =
    | { success: true }
    | { success: false; error: string };

type CreateAwardFormPayload = {
    name: string;
    title: string;
    category: string;
};

function getResourceHref(resource: Team): string | null {
    return resource.link("self")?.href ?? resource.uri ?? null;
}

export async function createAwardForTeam(
    teamId: string,
    payload: CreateAwardFormPayload
): Promise<CreateAwardResult> {
    try {
        const name = payload.name.trim();
        const title = payload.title.trim();
        const category = payload.category.trim();

        if (!name || !title || !category) {
            throw new Error("All award fields are required.");
        }

        const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
        if (!isAdmin(currentUser)) {
            throw new AuthenticationError("You are not allowed to create awards.", 403);
        }

        const teamsService = new TeamsService(serverAuthProvider);
        const editionsService = new EditionsService(serverAuthProvider);
        const awardsService = new AwardsService(serverAuthProvider);

        const team = await teamsService.getTeamById(teamId);

        const teamHref = getResourceHref(team);
        const teamEditionHref = team.link("edition")?.href ?? (typeof Reflect.get(team, "edition") === "string" ? Reflect.get(team, "edition") : null);

        if (!teamHref) {
            throw new NotFoundError("The team could not be resolved.");
        }

        if (!teamEditionHref) {
            throw new Error("This team is not linked to an edition.");
        }

        const resolvedEdition = await editionsService.getEditionByUri(teamEditionHref);
        const editionHref = resolvedEdition.link("self")?.href ?? resolvedEdition.uri ?? teamEditionHref;

        await awardsService.createAward({
            name,
            title,
            category,
            edition: editionHref,
            winner: teamHref,
        });

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create award";
        return { success: false, error: message };
    }
}
