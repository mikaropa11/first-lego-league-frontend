"use server";

import { MatchesService } from "@/api/matchesApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin, isReferee } from "@/lib/authz";
import { parseErrorMessage } from "@/types/errors";
import {
    RegisterMatchScoreRequest,
    RegisterMatchScoreResponse,
} from "@/types/matchResult";

interface UpdateMatchResultScoresRequest {
    readonly teamAResultUri: string;
    readonly teamBResultUri: string;
    readonly previousTeamAScore: number;
    readonly previousTeamBScore: number;
    readonly teamAScore: number;
    readonly teamBScore: number;
}

function validateScores(teamAScore: number, teamBScore: number) {
    if (
        !Number.isInteger(teamAScore) ||
        !Number.isInteger(teamBScore) ||
        teamAScore < 0 ||
        teamBScore < 0
    ) {
        throw new Error("Scores must be non-negative whole numbers.");
    }
}

async function assertCanManageMatchResults() {
    const auth = await serverAuthProvider.getAuth();

    if (!auth) {
        throw new Error("You must be logged in to manage match results.");
    }

    const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();

    if (!isAdmin(currentUser) && !isReferee(currentUser)) {
        throw new Error("You are not allowed to manage match results.");
    }
}

export async function registerMatchResult(
    data: RegisterMatchScoreRequest,
): Promise<RegisterMatchScoreResponse> {
    await assertCanManageMatchResults();

    const { teamAScore, teamBScore } = data.score;
    validateScores(teamAScore, teamBScore);

    try {
        return await new MatchesService(serverAuthProvider).registerMatchResult(data);
    } catch (e) {
        throw new Error(parseErrorMessage(e));
    }
}

export async function updateMatchResultScores({
    teamAResultUri,
    teamBResultUri,
    previousTeamAScore,
    previousTeamBScore,
    teamAScore,
    teamBScore,
}: UpdateMatchResultScoresRequest): Promise<void> {
    await assertCanManageMatchResults();
    validateScores(teamAScore, teamBScore);
    validateScores(previousTeamAScore, previousTeamBScore);

    const service = new MatchesService(serverAuthProvider);

    try {
        await service.updateMatchResult(teamAResultUri, teamAScore);

        try {
            await service.updateMatchResult(teamBResultUri, teamBScore);
        } catch (secondUpdateError) {
            try {
                await service.updateMatchResult(teamAResultUri, previousTeamAScore);
            } catch (rollbackError) {
                console.error("Failed to rollback Team A score update:", rollbackError);
            }

            throw secondUpdateError;
        }
    } catch (e) {
        throw new Error(parseErrorMessage(e));
    }
}
