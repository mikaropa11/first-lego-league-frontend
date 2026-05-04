import type { AuthStrategy } from "@/lib/authProvider";
import type { HalPage } from "@/types/pagination";
import { ScientificProject } from "@/types/scientificProject";
import { Team } from "@/types/team";
import { deleteHal, fetchHalCollection, fetchHalPagedCollection, fetchHalResource, getHal, mergeHal, mergeHalArray, patchHal, postHal } from "./halClient";

function normalizeSearchValue(value: string | undefined): string {
    return value?.trim().toLowerCase() ?? "";
}

function getProjectTeamHref(project: ScientificProject): string | null {
    const teamLink = project.link("team")?.href;
    if (teamLink) return teamLink;

    if (project.team?.startsWith("/") || project.team?.startsWith("http")) {
        return project.team;
    }

    return null;
}

export class ScientificProjectsService {
    constructor(private readonly authStrategy: AuthStrategy) { }

    async getScientificProjects(): Promise<ScientificProject[]> {
        const resource = await getHal('/scientificProjects?size=1000', this.authStrategy);
        const embedded = resource.embeddedArray('scientificProjects') || [];
        return mergeHalArray<ScientificProject>(embedded);
    }

    async getScientificProjectsPaged(page: number, size: number): Promise<HalPage<ScientificProject>> {
        return fetchHalPagedCollection<ScientificProject>(
            "/scientificProjects",
            this.authStrategy,
            "scientificProjects",
            page,
            size
        );
    }

    async getScientificProjectsByTeamName(teamName: string): Promise<ScientificProject[]> {
        const encodedTeamName = encodeURIComponent(teamName);
        return fetchHalCollection<ScientificProject>(
            `/scientificProjects/search/findByTeamName?teamName=${encodedTeamName}`,
            this.authStrategy,
            "scientificProjects"
        );
    }

    async searchScientificProjectsByTeamName(teamName: string): Promise<ScientificProject[]> {
        const trimmedTeamName = teamName.trim();
        const normalizedTeamName = normalizeSearchValue(trimmedTeamName);
        if (!normalizedTeamName) {
            return this.getScientificProjects();
        }

        const exactMatches = await this.getScientificProjectsByTeamName(trimmedTeamName);
        if (exactMatches.length > 0) {
            return exactMatches;
        }

        const projects = await this.getScientificProjects();
        const teamCache = new Map<string, Promise<Team | null>>();

        const matchingProjects = await Promise.all(
            projects.map(async (project) => {
                const inlineTeamName = normalizeSearchValue(project.team);
                if (inlineTeamName.includes(normalizedTeamName)) {
                    return project;
                }

                const teamHref = getProjectTeamHref(project);
                if (!teamHref) {
                    return null;
                }

                if (!teamCache.has(teamHref)) {
                    teamCache.set(
                        teamHref,
                        fetchHalResource<Team>(teamHref, this.authStrategy).catch(() => null)
                    );
                }

                const team = await teamCache.get(teamHref);
                const teamNameMatches = normalizeSearchValue(team?.name).includes(normalizedTeamName);
                const teamIdMatches = normalizeSearchValue(team?.id).includes(normalizedTeamName);

                return teamNameMatches || teamIdMatches ? project : null;
            })
        );

        return matchingProjects.filter((project): project is ScientificProject => project !== null);
    }

    async getScientificProjectsByEdition(editionId: string): Promise<ScientificProject[]> {
        const encodedId = encodeURIComponent(editionId);
        const resource = await getHal(`/scientificProjects/search/findByEditionId?editionId=${encodedId}`, this.authStrategy);
        const embedded = resource.embeddedArray('scientificProjects') || [];
        return mergeHalArray<ScientificProject>(embedded);
    }

    async getScientificProjectById(id: string): Promise<ScientificProject> {
        const projectId = encodeURIComponent(id);
        return fetchHalResource<ScientificProject>(`/scientificProjects/${projectId}`, this.authStrategy);
    }

    async createScientificProject(project: ScientificProject): Promise<ScientificProject> {
        const resource = await postHal('/scientificProjects', project, this.authStrategy);
        if (!resource) throw new Error('Failed to create scientific project');
        return mergeHal<ScientificProject>(resource);
    }

    private async patchScientificProject(
        id: string,
        data: Record<string, unknown>
    ): Promise<ScientificProject | null> {
        const projectId = encodeURIComponent(id);
        const resource = await patchHal(`/scientificProjects/${projectId}`, data, this.authStrategy);
        return resource ? mergeHal<ScientificProject>(resource) : null;
    }

    async editScientificProjectInfo(
        id: string,
        data: { comments: string; team: string; edition: string }
    ): Promise<ScientificProject | null> {
        return this.patchScientificProject(id, data);
    }

    async updateScientificProject(
        id: string,
        data: { score: number; comments: string }
    ): Promise<ScientificProject | null> {
        return this.patchScientificProject(id, data);
    }

    async deleteScientificProject(id: string): Promise<void> {
        const projectId = encodeURIComponent(id);
        await deleteHal(`/scientificProjects/${projectId}`, this.authStrategy);
    }
}
