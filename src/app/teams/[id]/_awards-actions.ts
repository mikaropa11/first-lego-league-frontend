"use server";

import { revalidatePath } from "next/cache";
import { AwardsService } from "@/api/awardApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";

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