"use server";

import { revalidatePath } from "next/cache";
import { AwardsService } from "@/api/awardApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";

export async function deleteAwardAction(teamId: string, awardId: string) {
    try {
        const userService = new UsersService(serverAuthProvider);
        const currentUser = await userService.getCurrentUser().catch(() => null);

        if (!isAdmin(currentUser)) {
            throw new Error("Unauthorized: Only administrators can delete awards");
        }

        const service = new AwardsService(serverAuthProvider);
        await service.deleteAward(awardId);
        revalidatePath(`/teams/${teamId}`);
        return { success: true };
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Failed to delete award" };
    }
}

type UpdateAwardPayload = {
    name: string;
    title: string;
    category: string;
    edition: string;
};

export async function updateAwardAction(teamId: string, awardUri: string, payload: UpdateAwardPayload) {
    try {
        const userService = new UsersService(serverAuthProvider);
        const currentUser = await userService.getCurrentUser().catch(() => null);

        if (!isAdmin(currentUser)) {
            throw new AuthenticationError("Unauthorized: Only administrators can edit awards");
        }

        const name = payload.name.trim();
        const title = payload.title.trim();
        const category = payload.category.trim();
        const edition = payload.edition.trim();

        if (!name || !edition) {
            return { success: false, error: "Award name and edition are required." };
        }

        const service = new AwardsService(serverAuthProvider);
        await service.updateAward(awardUri, { name, title, category, edition });
        revalidatePath(`/teams/${teamId}`);
        return { success: true };
    } catch (e: unknown) {
        return { success: false, error: parseErrorMessage(e) };
    }
}
