'use server';

import { ScientificProjectsService } from '@/api/scientificProjectApi';
import { serverAuthProvider } from '@/lib/authProvider';
import { isAdmin } from '@/lib/authz';
import { UsersService } from '@/api/userApi';
import { AuthenticationError } from '@/types/errors';
import { revalidatePath } from 'next/cache';

async function assertAdminAccess() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) throw new AuthenticationError();

    const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    if (!isAdmin(currentUser)) {
        throw new AuthenticationError("You are not allowed to edit scientific projects.", 403);
    }
}

export async function editScientificProject(
    id: string,
    data: { name: string; score: number; comments: string; team: string; edition: string }
) {
    try {
        await assertAdminAccess();

        const service = new ScientificProjectsService(serverAuthProvider);
        await service.editScientificProjectInfo(id, data);

        revalidatePath(`/scientific-projects/${id}`);
        revalidatePath(`/scientific-projects/${id}/edit`);

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error updating the scientific project';
        return { success: false, error: message };
    }
}
