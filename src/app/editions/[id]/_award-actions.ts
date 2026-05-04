'use server';

import { AwardsService } from "@/api/awardApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";
import { revalidatePath } from "next/cache";

async function assertAdminAccess() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        throw new AuthenticationError();
    }

    const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    if (!isAdmin(currentUser)) {
        throw new AuthenticationError("You are not allowed to edit awards.", 403);
    }
}

export async function updateAward(awardUri: string, editionId: string, formData: FormData) {
    try {
        await assertAdminAccess();

        if (!awardUri) {
            return { success: false, error: "Award resource is not available." };
        }

        const name = String(formData.get("name") ?? "").trim();
        const title = String(formData.get("title") ?? "").trim();
        const category = String(formData.get("category") ?? "").trim();
        const edition = String(formData.get("edition") ?? "").trim();

        if (!name) {
            return { success: false, error: "Award name is required." };
        }

        if (!edition) {
            return { success: false, error: "Award edition is required." };
        }

        const service = new AwardsService(serverAuthProvider);
        await service.updateAward(awardUri, {
            name,
            title,
            category,
            edition,
        });

        revalidatePath(`/editions/${editionId}`);

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: parseErrorMessage(error),
        };
    }
}
