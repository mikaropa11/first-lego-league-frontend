"use server";

import { CreateMatchPayload, MatchesService } from "@/api/matchesApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";
import { redirect } from "next/navigation";
import { validateMatchPayload } from "../../match-form-validation";

type UpdateMatchResult = { ok: false; error: string };

export async function updateMatch(matchId: string, data: CreateMatchPayload): Promise<UpdateMatchResult> {
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
    } catch (error) {
        return { ok: false, error: parseErrorMessage(error) };
    }

    redirect(`/matches/${matchId}`);
}
