"use server";

import { MatchesService, UpdateMatchPayload } from "@/api/matchesApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";
import { validateMatchPayload } from "../../match-form-validation";

export async function updateMatch(matchId: string, data: UpdateMatchPayload) {
    try {
        const auth = await serverAuthProvider.getAuth();
        if (!auth) {
            throw new AuthenticationError();
        }

        const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();

        if (!isAdmin(currentUser)) {
            throw new AuthenticationError("You are not allowed to edit matches.", 403);
        }

        await new MatchesService(serverAuthProvider).updateMatch(
            matchId,
            validateMatchPayload(data),
        );

        return { destination: `/matches/${matchId}` };
    } catch (error) {
        return { error: parseErrorMessage(error) };
    }
}
