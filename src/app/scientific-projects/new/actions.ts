"use server";

import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { ScientificProject } from "@/types/scientificProject";

export async function createScientificProject(
    data: Pick<ScientificProject, "name" | "score" | "comments" | "team" | "edition">
) {
    try {
        const service = new ScientificProjectsService(serverAuthProvider);
        await service.createScientificProject(data as ScientificProject);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error creating the scientific project";
        return { success: false, error: message };
    }
}
