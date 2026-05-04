"use server";

import { TeamsService, UpdateMemberPayload } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import { API_BASE_URL } from "@/api/halClient";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError } from "@/types/errors";

function normalizeMemberUri(uri: string): string {
    if (uri.startsWith("http")) {
        try {
            const parsed = new URL(uri);
            const apiOrigin = new URL(API_BASE_URL).origin;
            if (parsed.origin !== apiOrigin) return "";
            return parsed.pathname;
        } catch {
            return "";
        }
    }
    return uri;
}

export async function updateTeamMember(
    teamId: string,
    memberUri: string,
    data: UpdateMemberPayload
): Promise<void> {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) throw new AuthenticationError();

    const usersService = new UsersService(serverAuthProvider);
    const teamsService = new TeamsService(serverAuthProvider);

    const [currentUser, coaches, teamMembers] = await Promise.all([
        usersService.getCurrentUser(),
        teamsService.getTeamCoach(teamId),
        teamsService.getTeamMembers(teamId),
    ]);

    const currentEmail = currentUser?.email?.trim().toLowerCase();
    const userIsAdmin = isAdmin(currentUser);
    const userIsCoach =
        !!currentEmail &&
        coaches.some(c => c.emailAddress?.trim().toLowerCase() === currentEmail);

    if (!userIsAdmin && !userIsCoach) {
        throw new AuthenticationError("You are not allowed to edit team members.", 403);
    }

    const normalizedIncoming = normalizeMemberUri(memberUri);
    const memberBelongsToTeam =
        !!normalizedIncoming &&
        teamMembers.some(m => {
            const mUri = m.uri ?? m.link("self")?.href ?? "";
            return normalizeMemberUri(mUri) === normalizedIncoming;
        });

    if (!memberBelongsToTeam) {
        throw new AuthenticationError("Member does not belong to the specified team.", 403);
    }

    await teamsService.updateTeamMember(memberUri, data);
}